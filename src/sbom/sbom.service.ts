import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sbom } from './entities/sbom.entity';
import { Component } from './entities/component.entity';
import { Release } from '../products/entities/release.entity';

@Injectable()
export class SbomService {
  constructor(
    @InjectRepository(Sbom)
    private sbomRepository: Repository<Sbom>,
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
  ) {}

  async ingestSbom(release: Release, sbomData: any): Promise<Sbom> {
    // 1. Create or Update SBOM
    let sbom = await this.sbomRepository.findOne({ where: { release: { id: release.id } } });
    if (!sbom) {
      sbom = this.sbomRepository.create({
        release,
        content: sbomData,
      });
    } else {
        sbom.content = sbomData;
    }
    sbom = await this.sbomRepository.save(sbom);

    // 2. Parse Components (Basic CycloneDX parsing)
    const rawComponents = sbomData.components || [];
    
    // Clear existing components for this SBOM to avoid stale data on re-ingest
    // A better approach would be diffing, but for MVP, delete and recreate is safer.
    await this.componentRepository.delete({ sbom: { id: sbom.id } });

    const componentsToSave: Component[] = [];
    for (const comp of rawComponents) {
      // Basic validation
      if (!comp.name || !comp.version) continue;

      // Extract Helper
      const supplier = typeof comp.supplier === 'string' ? comp.supplier : comp.supplier?.name;
      
      let licenses: string[] = [];
      if (comp.licenses && Array.isArray(comp.licenses)) {
          licenses = comp.licenses.map((l: any) => l.license?.id || l.license?.name || l.expression).filter(Boolean);
      }

      let hashes: any = {};
      if (comp.hashes && Array.isArray(comp.hashes)) {
          comp.hashes.forEach((h: any) => {
              if(h.alg && h.content) hashes[h.alg] = h.content;
          });
      }

      const component = this.componentRepository.create({
        name: comp.name,
        version: comp.version,
        purl: comp.purl,
        cpe: comp.cpe,
        supplier: supplier,
        licenses: licenses,
        hashes: hashes,
        sbom: sbom,
      });
      componentsToSave.push(component);
    }

    if (componentsToSave.length > 0) {
        await this.componentRepository.save(componentsToSave);
    }

    return sbom;
  }

  async count(organizationId: string): Promise<number> {
    return this.sbomRepository.count({
        where: {
            release: {
                product: {
                    organization: { id: organizationId } 
                }
            }
        }
    });
  }

  async findRecent(organizationId: string): Promise<Sbom[]> {
    return this.sbomRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['release', 'release.product', 'release.product.organization'],
      where: {
        release: {
          product: {
            organization: { id: organizationId } 
          }
        }
      }
    });
  }
}
