import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sbom } from './entities/sbom.entity';
import { Release } from '../products/entities/release.entity';
import { BadRequestException } from '@nestjs/common';

import { AnalysisService } from '../analysis/analysis.service';
import { Vulnerability } from '../vuln/entities/vulnerability.entity';

@Injectable()
export class SbomService {
  constructor(
    @InjectRepository(Sbom)
    private sbomRepository: Repository<Sbom>,
    @InjectRepository(Release)
    private releaseRepository: Repository<Release>,
    private analysisService: AnalysisService,
    @InjectRepository(Vulnerability)
    private vulnRepository: Repository<Vulnerability>,
  ) {}



  async ingestSbom(release: Release, sbomData: any): Promise<Sbom> {
    this.validateSbom(sbomData);

    // 1. Create or Update SBOM
    let sbom = await this.sbomRepository.findOne({
      where: { release: { id: release.id } },
    });
    if (!sbom) {
      sbom = this.sbomRepository.create({
        release,
        content: sbomData,
      });
    } else {
      sbom.content = sbomData;
      sbom.release = release;
      sbom.updatedAt = new Date(); // Force update SBOM

      // Also touch release update time
      release.updatedAt = new Date();
      await this.releaseRepository.save(release);
    }
    sbom = await this.sbomRepository.save(sbom);

    // --- Supply Chain Analysis (Typosquatting) ---
    try {
        const typoFindings = await this.analysisService.analyzeTyposquatting(sbom);
        if (typoFindings.length > 0) {
            console.log(`[Analysis] Found ${typoFindings.length} potential typosquatting packages.`);
            
            for (const finding of typoFindings) {
                const id = `OTT-TYPO-${Buffer.from(finding.component).toString('hex').slice(0, 6)}`;
                
                const exists = await this.vulnRepository.findOne({ where: { id } });
                if (!exists) {
                    const v = this.vulnRepository.create({
                        id,
                        summary: `Potential Typosquatting: '${finding.component}' is similar to '${finding.target}'`,
                        details: `The package '${finding.component}' has a Levenshtein distance of ${finding.distance} from popular package '${finding.target}'. This could be a typosquatting attack. Please verify the authenticity of this package.`,
                        severity: 'HIGH',
                        isExploitable: true, // Treat as dangerous until proven otherwise
                        references: [],
                        affectedPackages: [{ package: { name: finding.component, ecosystem: 'npm' } }], // Simplified
                        modified: new Date(),
                    });
                    await this.vulnRepository.save(v);
                }
            }
        }
    } catch (e) {
        console.error('Typosquatting analysis failed', e);
    }

    // --- Supply Chain Analysis (Malicious Signals) ---
    try {
        const malFindings = await this.analysisService.analyzeMaliciousSignals(sbom);
        if (malFindings.length > 0) {
            console.log(`[Analysis] Found ${malFindings.length} potential malicious packages.`);
            
            for (const finding of malFindings) {
                const id = `OTT-MAL-${Buffer.from(finding.component).toString('hex').slice(0, 6)}`;
                
                const exists = await this.vulnRepository.findOne({ where: { id } });
                if (!exists) {
                    const v = this.vulnRepository.create({
                        id,
                        summary: `Malicious Signal: Package '${finding.component}' flagged as ${finding.type}`,
                        details: finding.details,
                        severity: finding.severity, // CRITICAL or HIGH
                        isExploitable: true,
                        references: [],
                        affectedPackages: [{ package: { name: finding.component, ecosystem: 'npm' } }],
                        modified: new Date(),
                    });
                    await this.vulnRepository.save(v);
                }
            }
        }
    } catch (e) {
        console.error('Malicious signal analysis failed', e);
    }

    // --- Provenance / Integrity Analysis ---
    try {
        const provFindings = await this.analysisService.analyzeProvenance(sbom);
        if (provFindings.length > 0) {
            console.log(`[Analysis] Provenance Check: ${provFindings.length} issues found.`);
            
            for (const finding of provFindings) {
                const id = 'OTT-UNSIGNED-SBOM'; // Static ID for this specific check
                
                const exists = await this.vulnRepository.findOne({ where: { id } });
                if (!exists) {
                     const v = this.vulnRepository.create({
                        id,
                        summary: 'Unsigned SBOM (Untrusted Integrity)',
                        details: finding.details,
                        severity: finding.severity,
                        isExploitable: true, // Risk of tampering is exploitable
                        references: [],
                        affectedPackages: [], // Affects the whole project
                        modified: new Date(),
                    });
                     await this.vulnRepository.save(v);
                }
            }
        }
    } catch (e) {
        console.error('Provenance analysis failed', e);
    }


    // 2. Parse Components (Basic CycloneDX parsing)
    // OPTIMIZATION: We no longer save individual components to the 'component' table to avoid row explosion (200+ per ingest).
    // We rely on the 'content' JSONB column for the full SBOM data.
    // The VEX and Portal services will read from 'sbom.content.components'.

    /* 
    const rawComponents = sbomData.components || [];
    await this.componentRepository.delete({ sbom: { id: sbom.id } });
    
    // ... (Code removed for optimization) ...
    // See git history if component-level granularity is needed again.
    */

    return sbom;
  }

  async count(organizationId: string): Promise<number> {
    return this.sbomRepository.count({
      where: {
        release: {
          product: {
            organization: { id: organizationId },
          },
        },
      },
    });
  }

  async findRecent(organizationId: string): Promise<Sbom[]> {
    return this.sbomRepository.find({
      order: { updatedAt: 'DESC' },
      take: 5,
      relations: ['release', 'release.product', 'release.product.organization'],
      where: {
        release: {
          product: {
            organization: { id: organizationId },
          },
        },
      },
    });
  }
  async findByReleaseId(releaseId: string): Promise<Sbom | null> {
    return this.sbomRepository.findOne({
      where: { release: { id: releaseId } },
    });
  }

  private validateSbom(data: any) {
    if (!data) {
      throw new BadRequestException('SBOM data is empty');
    }

    // CycloneDX specific validation
    if (data.bomFormat !== 'CycloneDX') {
      throw new BadRequestException('Invalid BOM format: must be CycloneDX');
    }

    if (!data.specVersion) {
        throw new BadRequestException('Missing specVersion in SBOM');
    }

    if (!data.components && !data.metadata) {
        throw new BadRequestException('SBOM must contain components or metadata');
    }
  }
}
