import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VexStatement, VexStatus } from './entities/vex-statement.entity';
import { Sbom } from '../sbom/entities/sbom.entity';
import { VulnService } from '../vuln/vuln.service';
import { UpdateVexStatusDto } from './dto/update-vex-status.dto';
import { CreateVexDto } from './dto/create-vex.dto';
import { Product } from '../products/entities/product.entity';
import { Vulnerability } from '../vuln/entities/vulnerability.entity';
import { EntityManager } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class VexService {
  constructor(
    @InjectRepository(VexStatement)
    private vexRepository: Repository<VexStatement>,
    private vulnService: VulnService,
    private entityManager: EntityManager,
  ) {}

  async create(dto: CreateVexDto, userId: string) {
    // 1. Find or Create Product
    // Use entityManager to find valid org for user first? Or just use relation match.
    // We need to know organization ID of the user.
    // For now assuming we can link by userId -> organization relation query or assume implicit.
    // Let's query user's organization first.
    const user = await this.entityManager.findOne(User, { where: { id: userId }, relations: ['organization'] });
    if (!user || !user.organization) throw new Error('User has no organization');

    let product = await this.entityManager.findOne(Product, { 
        where: { name: dto.productName, organization: { id: user.organization.id } } 
    });
    
    if (!product) {
        product = this.entityManager.create(Product, { 
            name: dto.productName, 
            version: '1.0.0',
            organization: user.organization
        });
        await this.entityManager.save(product);
    }

    // 2. Find or Create Vulnerability
    let vuln = await this.entityManager.findOne(Vulnerability, { where: { id: dto.vulnerabilityId } });
    if (!vuln) {
        vuln = this.entityManager.create(Vulnerability, { 
            id: dto.vulnerabilityId, 
            severity: 'Unknown', // Default
            description: 'Manually created via VEX Manager',
            affectedPackages: []
        });
        await this.entityManager.save(vuln);
    }

    // 3. Create VEX Statement
    const statement = this.vexRepository.create({
        product: product,
        vulnerability: vuln,
        status: dto.status,
        justification: dto.justification,
        componentPurl: `pkg:generic/${dto.productName}@1.0.0` // Placeholder
    });

    return this.vexRepository.save(statement);
  }

  async correlate(sbom: Sbom) {
    // 1. Get components
    const components = sbom.components || [];
    if (components.length === 0) return;

    // 2. Enrich with OSV Data (Batch)
    // This returns a map of purl -> Vulnerability[]
    const vulnerabilitiesMap = await this.vulnService.enrichWithOsv(components);
    
    // 3. Create VEX Statements
    for (const comp of components) {
        if (!comp.purl) continue;
        const vulns = vulnerabilitiesMap[comp.purl];
        if (!vulns || vulns.length === 0) continue;

        for (const vuln of vulns) {
            const product = sbom.release.product;

            // Check if VEX statement exists for this Product + Vuln + Component
            let statement = await this.vexRepository.findOne({
                where: {
                    product: { id: product.id },
                    vulnerability: { id: vuln.id },
                    componentPurl: comp.purl
                }
            });

            if (!statement) {
                statement = this.vexRepository.create({
                    product: product,
                    vulnerability: vuln,
                    componentPurl: comp.purl,
                    status: VexStatus.UNDER_INVESTIGATION,
                    justification: 'Automatically correlated via OSV'
                });
                await this.vexRepository.save(statement);
            }
        }
    }
  }

  async findAllByProduct(productId: string, userId: string, query?: any) {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      const whereClause: any = { 
          product: { 
              id: productId,
              owner: { id: userId }
          } 
      };
      if (query?.status) {
          whereClause.status = query.status;
      }

      const [data, total] = await this.vexRepository.findAndCount({
          where: whereClause,
          relations: ['vulnerability', 'product'],
          skip,
          take: limit,
          order: { id: 'DESC' }
      });

      return {
          data,
          meta: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
          }
      };
  }

  async updateStatus(id: string, userId: string, dto: UpdateVexStatusDto) {
      const statement = await this.vexRepository.findOne({ 
          where: { id },
          relations: ['product', 'product.organization', 'product.organization.users']
      });
      
      if (!statement) throw new Error('VEX Statement not found');

      const isMember = statement.product.organization.users.some(u => u.id === userId);
      if (!isMember) {
          throw new Error('Unauthorized access to VEX statement');
      }
      
      if (dto.status === VexStatus.NOT_AFFECTED && !dto.justification && !statement.justification) {
          throw new Error('Justification is required when setting status to NOT_AFFECTED');
      }

      statement.status = dto.status;
      if (dto.justification) statement.justification = dto.justification;
      
      return this.vexRepository.save(statement);
  }

  async count(organizationId: string): Promise<number> {
    return this.vexRepository.count({
        where: {
            product: { organization: { id: organizationId } }
        }
    });
  }

  async countResolved(organizationId: string): Promise<number> {
    return this.vexRepository.count({ 
        where: [
            { status: VexStatus.FIXED, product: { organization: { id: organizationId } } },
            { status: VexStatus.NOT_AFFECTED, product: { organization: { id: organizationId } } }
        ]
    });
  }

  async countCritical(organizationId: string): Promise<number> {
      return this.vexRepository.count({
          where: [
            { 
              vulnerability: { severity: 'CRITICAL' }, 
              status: VexStatus.AFFECTED,
              product: { organization: { id: organizationId } } 
            },
            {
              vulnerability: { severity: 'CRITICAL' }, 
              status: VexStatus.UNDER_INVESTIGATION,
              product: { organization: { id: organizationId } } 
            }
          ],
          relations: ['vulnerability', 'product']
      });
  }

  async findRecent(organizationId: string): Promise<VexStatement[]> {
    return this.vexRepository.find({
      order: { id: 'DESC' },
      take: 5,
      relations: ['vulnerability', 'product', 'product.organization'],
      where: {
          product: { organization: { id: organizationId } }
      }
    });
  }

  async findAll(organizationId: string, query?: any) {
      const page = query?.page || 1;
      const limit = query?.limit || 10;
      const skip = (page - 1) * limit;

      const whereClause: any = {
          product: { organization: { id: organizationId } }
      };
      if (query?.status && query.status !== 'all') {
          whereClause.status = query.status;
      }

      const [data, total] = await this.vexRepository.findAndCount({
          where: whereClause,
          relations: ['vulnerability', 'product'],
          skip,
          take: limit,
          order: { id: 'DESC' }
      });

      return {
          data,
          meta: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
          }
      };
  }
}
