import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Release } from './entities/release.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Release)
    private releasesRepository: Repository<Release>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async ensureProduct(name: string, userId: string): Promise<Product> {
    const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['organization'] });
    if (!user || !user.organization) throw new Error('User or Organization not found');

    let product = await this.productsRepository.findOne({ 
        where: { 
            name, 
            organization: { id: user.organization.id } 
        } 
    });
    
    if (!product) {
      product = this.productsRepository.create({ 
          name, 
          organization: user.organization 
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
        if (commitSha) release.commitSha = commitSha;
        if (buildId) release.buildId = buildId;
        if (imageDigest) release.imageDigest = imageDigest;
        if (platform) release.platform = platform;
        await this.releasesRepository.save(release);
    }

    return release;
  }
}
