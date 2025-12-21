import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sbom } from '../sbom/entities/sbom.entity';
import { VexStatement, VexStatus } from '../vex/entities/vex-statement.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(Sbom)
    private sbomRepository: Repository<Sbom>,
    @InjectRepository(VexStatement)
    private vexRepository: Repository<VexStatement>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getSbom(productName: string, version: string) {
    const sbom = await this.sbomRepository.findOne({
      where: {
        release: {
          product: { name: productName },
          version: version
        }
      },
      relations: ['release', 'release.product', 'components']
    });

    if (!sbom) throw new NotFoundException('SBOM not found for this product version');
    return sbom.content; // Return the raw JSON content
    // OR create a download stream if content is large.
  }

  async getVex(productName: string, version: string) {
    // Find release first to verify existence?
    // VEX is tied to Product/Release context.
    // Assuming we want VEX statements for this specific release (which might just reflect Product-wide statements).
    // Our VexStatement has `product` relation. 
    // And `componentPurl` matches components in this release.
    
    // 1. Get SBOM to know components
    const sbom = await this.sbomRepository.findOne({
        where: {
            release: {
                product: { name: productName },
                version: version
            }
        },
        relations: ['release', 'release.product', 'components']
    });
    
    if (!sbom) throw new NotFoundException('Release not found');

    // 2. Find VEX statements for this product
    const statements = await this.vexRepository.find({
        where: { product: { id: sbom.release.product.id } },
        relations: ['vulnerability']
    });

    // 3. Filter/Map or just return all statements for the product
    // Usually VEX is a document. We should generate a CycloneDX VEX or CSAF.
    // For MVP, just return JSON list of statements.
    return {
        product: productName,
        version: version,
        statements: statements.map(s => ({
            id: s.id,
            vulnerability: s.vulnerability.id,
            status: s.status,
            purl: s.componentPurl,
            justification: s.justification
        }))
    };
  }

  async getAuditPack(productName: string, version: string) {
    // 1. Get SBOM and Release Metadata
    const sbom = await this.sbomRepository.findOne({
        where: {
            release: {
                product: { name: productName },
                version: version
            }
        },
        relations: ['release', 'release.product', 'components']
    });

    if (!sbom) throw new NotFoundException('SBOM not found');

    // 2. Get VEX Statements with Vulnerability Details
    const statements = await this.vexRepository.find({
        where: { product: { id: sbom.release.product.id } },
        relations: ['vulnerability']
    });

    // 3. Construct Bundle
    return {
        schema: "ottric-audit-pack-v1",
        generatedAt: new Date(),
        product: {
            name: sbom.release.product.name,
            version: sbom.release.version,
            commitSha: sbom.release.commitSha,
            buildId: sbom.release.buildId,
            imageDigest: sbom.release.imageDigest,
            platform: sbom.release.platform
        },
        sbom: sbom.content,
        vex: statements.map(s => ({
            id: s.id,
            status: s.status,
            justification: s.justification,
            componentPurl: s.componentPurl,
            vulnerability: {
                id: s.vulnerability.id,
                severity: s.vulnerability.severity,
                aliases: s.vulnerability.aliases,
                references: s.vulnerability.references
            }
        })),
        // summary statistics
        summary: {
            totalComponents: sbom.components.length,
            totalVulnerabilities: statements.length,
            affected: statements.filter(s => s.status === VexStatus.AFFECTED).length,
            notAffected: statements.filter(s => s.status === VexStatus.NOT_AFFECTED).length,
            fixed: statements.filter(s => s.status === VexStatus.FIXED).length,
            underInvestigation: statements.filter(s => s.status === VexStatus.UNDER_INVESTIGATION).length,
        }
    };
  }

  async getProjects(organizationId: string) {
      const products = await this.productRepository.find({
          where: { organization: { id: organizationId } },
          relations: ['releases'],
          order: { createdAt: 'DESC' }
      });

      // Enrich with stats
      // This is N+1 query problem potential, but fine for MVP
      const enriched = await Promise.all(products.map(async (p) => {
          // Get latest release
          const releases = p.releases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const latest = releases[0];

          // Count Open Critical/High VEX
          const vexCount = await this.vexRepository.count({
              where: {
                  product: { id: p.id },
                  status: VexStatus.AFFECTED,
                  // vulnerability: { severity: 'CRITICAL' } // Can't filter relation deep in count easily without query builder
              },
              // relations: ['vulnerability'] 
          });
          
          // To get severity breakdown properly we'd need a builder or find()
          // Let's just return total "affected" count for now as "Risk Score" proxy
          
          return {
              id: p.id,
              name: p.name,
              description: p.description,
              latestVersion: latest?.version || 'N/A',
              lastUpdated: latest?.createdAt || p.createdAt,
              riskCount: vexCount
          };
      }));

      return enriched;
  }

  async getProductVersions(productName: string) {
      const product = await this.productRepository.findOne({
          where: { name: productName },
          relations: ['releases'],
      });

      if (!product) throw new NotFoundException('Product not found');

      return {
          product: {
              id: product.id,
              name: product.name,
              description: product.description,
              createdAt: product.createdAt
          },
          versions: product.releases.map(r => ({
              version: r.version,
              createdAt: r.createdAt,
              id: r.id
          })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      };
  }
}
