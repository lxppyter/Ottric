import { SecurityService } from '../common/security/security.service';
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Release } from './entities/release.entity';
import { User } from '../users/entities/user.entity';
import { BillingService } from '../billing/billing.service';
import { PolicyService } from '../policies/policy.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Release)
    private releasesRepository: Repository<Release>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private billingService: BillingService,
    private securityService: SecurityService,
    private policyService: PolicyService,
  ) {}

  async ensureProduct(name: string, userId: string): Promise<Product> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user) throw new Error('User not found');
    if (!user.organization)
      throw new Error(
        'User has no organization. Please join an organization to create projects.',
      );

    let product = await this.productsRepository.findOne({
      where: {
        name,
        organization: { id: user.organization.id },
      },
    });

    if (!product) {
      // Check Plan Limits
      const subscription = await this.billingService.getCurrentSubscription(
        user.organization.id,
      );
      const currentProductCount = await this.productsRepository.count({
        where: { organization: { id: user.organization.id } },
      });

      if (currentProductCount >= subscription.features.maxProjects) {
        throw new ForbiddenException(
          `Project limit reached for ${subscription.plan} plan (${subscription.features.maxProjects} max). Please upgrade to create more projects.`,
        );
      }

      product = this.productsRepository.create({
        name,
        organization: user.organization,
        // owner: user // Deprecated or keep as creator? Let's just use org.
      });
      await this.productsRepository.save(product);
    }
    return product;
  }

  async createRelease(
    product: Product,
    version: string,
    commitSha?: string,
    buildId?: string,
    imageDigest?: string,
    platform?: string,
  ): Promise<Release> {
    // Check if release exists
    let release = await this.releasesRepository.findOne({
      where: { product: { id: product.id }, version },
    });

    if (!release) {
      release = this.releasesRepository.create();
      release.product = product;
      release.version = version;
      release.commitSha = commitSha || null;
      release.buildId = buildId || null;
      release.imageDigest = imageDigest || null;
      release.platform = platform || null;

      await this.releasesRepository.save(release);
    } else {
      // Update metadata if exists (idempotency)
      release.product = product; // IMPORTANT: Ensure relation is loaded/set
      if (commitSha) release.commitSha = commitSha;
      if (buildId) release.buildId = buildId;
      if (imageDigest) release.imageDigest = imageDigest;
      if (platform) release.platform = platform;
      await this.releasesRepository.save(release);
    }

    return release;
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({ relations: ['organization'] });
  }

  async findLatestRelease(productId: string): Promise<Release | null> {
    return this.releasesRepository.findOne({
      where: { product: { id: productId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrganizationMembers(orgId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { organization: { id: orgId } },
    });
  }

  async deleteProduct(productId: string, orgId: string) {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
      relations: ['organization'],
    });
    if (!product) throw new Error('Product not found');
    if (product.organization.id !== orgId)
      throw new ForbiddenException('Unauthorized');

    return this.productsRepository.remove(product);
  }

  async renameProduct(productId: string, newName: string, orgId: string) {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
      relations: ['organization'],
    });
    if (!product) throw new Error('Product not found');
    if (product.organization.id !== orgId)
      throw new ForbiddenException('Unauthorized');

    product.name = newName;
    return this.productsRepository.save(product);
  }

  async updateProductContext(
    productId: string,
    orgId: string,
    data: {
      criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
      isInternetFacing?: boolean;
    },
  ) {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
      relations: ['organization'],
    });
    if (!product) throw new Error('Product not found');
    if (product.organization.id !== orgId)
      throw new ForbiddenException('Unauthorized');

    if (data.criticality) product.criticality = data.criticality;
    if (data.environment) product.environment = data.environment;
    if (data.isInternetFacing !== undefined)
      product.isInternetFacing = data.isInternetFacing;

    return this.productsRepository.save(product);
  }

  async updateIntegrationSettings(
    id: string, 
    organizationId: string, 
    settings: { repositoryUrl?: string; manifestFilePath?: string; githubToken?: string }
  ) {
    const product = await this.productsRepository.findOne({ where: { id, organization: { id: organizationId } } });
    if (!product) throw new NotFoundException('Product not found');

    if (settings.repositoryUrl !== undefined) product.repositoryUrl = settings.repositoryUrl;
    if (settings.manifestFilePath !== undefined) product.manifestFilePath = settings.manifestFilePath;
    
    if (settings.githubToken) {
        const { content, iv } = this.securityService.encrypt(settings.githubToken);
        product.githubToken = content;
        product.githubTokenIv = iv;
    }

    return this.productsRepository.save(product);
  }

  async setComplianceScore(productId: string, score: number, grade: string) {
    return this.productsRepository.update(productId, {
        complianceScore: score,
        complianceGrade: grade,
    });
  }
}
