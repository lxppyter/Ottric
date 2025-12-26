import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sbom } from '../sbom/entities/sbom.entity';
import { VexStatement, VexStatus } from '../vex/entities/vex-statement.entity';
import { Product } from '../products/entities/product.entity';
import { RiskService } from '../vuln/risk.service';
import * as semver from 'semver';
import { PackageURL } from 'packageurl-js';

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(Sbom)
    private sbomRepository: Repository<Sbom>,
    @InjectRepository(VexStatement)
    private vexRepository: Repository<VexStatement>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private riskService: RiskService,
  ) {}

  private calculateUpgradeRisk(currentVersion: string, fixedVersion: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' {
    if (!currentVersion || !fixedVersion) return 'UNKNOWN';

    try {
        // Handle "1.2.3, 1.3.0" case -> pick first
        const target = fixedVersion.split(',')[0].trim();
        
        const current = semver.coerce(currentVersion);
        const fixed = semver.coerce(target);

        if (!current || !fixed) return 'UNKNOWN';

        const diff = semver.diff(current, fixed);
        
        if (diff === 'major' || diff === 'premajor') return 'HIGH';
        if (diff === 'minor' || diff === 'preminor') return 'MEDIUM';
        if (diff === 'patch' || diff === 'prepatch' || diff === 'prerelease') return 'LOW';
        
        return 'UNKNOWN';
    } catch (e) {
        return 'UNKNOWN';
    }
  }

  async getSbom(productName: string, version: string) {
    const sbom = await this.sbomRepository.findOne({
      where: {
        release: {
          product: { name: productName },
          version: version,
        },
      },
      relations: ['release', 'release.product'],
    });

    if (!sbom)
      throw new NotFoundException('SBOM not found for this product version');
    return sbom.content; // Return the raw JSON content
  }

  async getVex(productName: string, version: string) {
    const sbom = await this.sbomRepository.findOne({
      where: {
        release: {
          product: { name: productName },
          version: version,
        },
      },
      relations: ['release', 'release.product'],
    });

    if (!sbom) throw new NotFoundException('Release not found');

    const statements = await this.vexRepository.find({
      where: { product: { id: sbom.release.product.id } },
      relations: ['vulnerability'],
    });

    return {
      product: productName,
      version: version,
      statements: statements.map((s) => ({
        id: s.id,
        vulnerability: {
            id: s.vulnerability.id,
            severity: (() => {
                const rawSev = s.vulnerability.severity ? String(s.vulnerability.severity).toUpperCase() : '';
                if (rawSev.startsWith('CVSS:')) {
                    let impactCount = 0;
                    if (rawSev.includes('C:H') || rawSev.includes('VC:H')) impactCount++;
                    if (rawSev.includes('I:H') || rawSev.includes('VI:H')) impactCount++;
                    if (rawSev.includes('A:H') || rawSev.includes('VA:H')) impactCount++;
                    
                    if (impactCount === 3) return 'CRITICAL';
                    if (impactCount === 2) return 'HIGH';
                    if (impactCount === 1) return 'HIGH';
                    return 'MEDIUM';
                }
                if (rawSev === 'MODERATE') return 'MEDIUM';
                return rawSev || 'UNKNOWN';
            })(),
            hasFix: s.vulnerability.hasFix,
            fixedIn: s.vulnerability.fixedIn,
            isExploitable: s.vulnerability.isExploitable
        },
        status: s.status,
        purl: s.componentPurl,
        justification: s.justification,
        reachability: s.reachability,
      })),
    };
  }

  async getAuditPack(productName: string, version: string) {
    const sbom = await this.sbomRepository.findOne({
      where: {
        release: {
          product: { name: productName },
          version: version,
        },
      },
      relations: ['release', 'release.product'],
    });

    if (!sbom) throw new NotFoundException('SBOM not found');

    const statements = await this.vexRepository.find({
      where: { product: { id: sbom.release.product.id } },
      relations: ['vulnerability'],
    });

    const affectedStatements = statements.filter(
      (s) => s.status === VexStatus.AFFECTED,
    );
    const riskScore = this.riskService.calculateProjectRiskScore(
      sbom.release.product,
      affectedStatements.map((s) => s.vulnerability),
    );

    return {
      schema: 'ottric-audit-pack-v1',
      generatedAt: new Date(),
      riskScore, // Added field
      product: {
        name: sbom.release.product.name,
        version: sbom.release.version,
        commitSha: sbom.release.commitSha,
        buildId: sbom.release.buildId,
        imageDigest: sbom.release.imageDigest,
        platform: sbom.release.platform,
      },
      sbom: sbom.content,
      vex: statements.map((s) => ({
        id: s.id,
        status: s.status,
        justification: s.justification,
        componentPurl: s.componentPurl,
        expiresAt: s.expiresAt, // Added
        reachability: s.reachability, // Added
        vulnerability: {
          id: s.vulnerability.id,
          summary: s.vulnerability.summary,
          details: s.vulnerability.details,
            severity: (() => {
                const rawSev = s.vulnerability.severity ? String(s.vulnerability.severity).toUpperCase() : '';
                if (rawSev.startsWith('CVSS:')) {
                    let impactCount = 0;
                    if (rawSev.includes('C:H') || rawSev.includes('VC:H')) impactCount++;
                    if (rawSev.includes('I:H') || rawSev.includes('VI:H')) impactCount++;
                    if (rawSev.includes('A:H') || rawSev.includes('VA:H')) impactCount++;
                    
                    if (impactCount === 3) return 'CRITICAL';
                    if (impactCount === 2) return 'HIGH';
                    if (impactCount === 1) return 'HIGH';
                    return 'MEDIUM';
                }
                if (rawSev === 'MODERATE') return 'MEDIUM';
                return rawSev || 'UNKNOWN';
            })(),
          aliases: s.vulnerability.aliases,
          references: s.vulnerability.references,
          epssScore: s.vulnerability.epssScore, // Added
          epssPercentile: s.vulnerability.epssPercentile, // Added
          isKev: s.vulnerability.isKev, // Added
          hasFix: s.vulnerability.hasFix,
          fixedIn: s.vulnerability.fixedIn,
          upgradeRisk: (() => {
              if (!s.vulnerability.fixedIn || !s.componentPurl) return 'UNKNOWN';
              try {
                  const purl = PackageURL.fromString(s.componentPurl);
                  if (!purl.version) return 'UNKNOWN';
                  return this.calculateUpgradeRisk(purl.version, s.vulnerability.fixedIn);
              } catch (e) {
                  return 'UNKNOWN';
              }
          })(),
        },
      })),
      summary: {
        totalComponents: sbom.content?.components?.length || 0,
        totalVulnerabilities: statements.length,
        affected: statements.filter((s) => s.status === VexStatus.AFFECTED)
          .length,
        notAffected: statements.filter(
          (s) => s.status === VexStatus.NOT_AFFECTED,
        ).length,
        fixed: statements.filter((s) => s.status === VexStatus.FIXED).length,
        underInvestigation: statements.filter(
          (s) => s.status === VexStatus.UNDER_INVESTIGATION,
        ).length,
      },
    };
  }

  async getProjects(organizationId: string) {
    const products = await this.productRepository.find({
      where: { organization: { id: organizationId } },
      relations: ['releases'],
      order: { createdAt: 'DESC' },
    });

    const enriched = await Promise.all(
      products.map(async (p) => {
        const releases = p.releases.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const latest = releases[0];

        const affectedStatements = await this.vexRepository.find({
          where: {
            product: { id: p.id },
            status: VexStatus.AFFECTED,
          },
          relations: ['vulnerability'],
        });

        console.log(`Debug Risk for ${p.name}: Found ${affectedStatements.length} affected vulns.`);

        const vulnerabilities = affectedStatements.map((s) => s.vulnerability);
        const riskScore = this.riskService.calculateProjectRiskScore(
          p,
          vulnerabilities,
        );
        console.log(`Debug Risk for ${p.name}: Calculated Score ${riskScore}`);

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          latestVersion: latest?.version || 'N/A',
          lastUpdated: latest?.updatedAt || latest?.createdAt || p.createdAt,
          riskScore: riskScore,
          riskCount: affectedStatements.length,
          criticality: p.criticality,
          environment: p.environment,
          complianceScore: p.complianceScore,
          complianceGrade: p.complianceGrade,
        };
      }),
    );

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
        createdAt: product.createdAt,
      },
      versions: product.releases
        .map((r) => ({
          version: r.version,
          createdAt: r.createdAt,
          id: r.id,
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    };
  }
}
