import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sbom } from './entities/sbom.entity';
import { Release } from '../products/entities/release.entity';

@Injectable()
export class SbomService {
  constructor(
    @InjectRepository(Sbom)
    private sbomRepository: Repository<Sbom>,
    @InjectRepository(Release)
    private releaseRepository: Repository<Release>,
  ) {}

  async ingestSbom(release: Release, sbomData: any): Promise<Sbom> {
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
}
