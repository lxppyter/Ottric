import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vulnerability } from './entities/vulnerability.entity';
import { Component } from '../sbom/entities/component.entity';

@Injectable()
export class VulnService {
  constructor(
    @InjectRepository(Vulnerability)
    private vulnRepository: Repository<Vulnerability>,
  ) {}

  async enrichWithOsv(components: Component[]): Promise<Record<string, Vulnerability[]>> {
    const componentsWithPurls = components.filter(c => c.purl);
    if (componentsWithPurls.length === 0) return {};

    const batchSize = 1000;
    const results: Record<string, Vulnerability[]> = {};

    for (let i = 0; i < componentsWithPurls.length; i += batchSize) {
      const batch = componentsWithPurls.slice(i, i + batchSize);
      
      const payload = {
        queries: batch.map(c => ({
          package: { purl: c.purl }
        }))
      };

      try {
        const response = await axios.post('https://api.osv.dev/v1/querybatch', payload);
        const batchResults = response.data.results;
        
        for (let j = 0; j < batchResults.length; j++) {
          const result = batchResults[j];
          const component = batch[j];
          const componentVulns: Vulnerability[] = [];

          if (result.vulns && result.vulns.length > 0) {
            for (const osvVuln of result.vulns) {
                // Upsert Vulnerability
                const vuln = new Vulnerability();
                vuln.id = osvVuln.id;
                vuln.summary = osvVuln.summary;
                vuln.details = osvVuln.details;
                vuln.modified = osvVuln.modified ? new Date(osvVuln.modified) : null;
                vuln.aliases = osvVuln.aliases || [];
                vuln.references = osvVuln.references || [];
                
                // Determine severity (simple logic: take the highest CVSS if available, or just the db specifics)
                // OSV severity is usually in `severity` array as CVSS vector
                if (osvVuln.severity && osvVuln.severity.length > 0) {
                    vuln.severity = osvVuln.severity[0].score || osvVuln.severity[0].type; 
                }

                await this.vulnRepository.save(vuln);
                componentVulns.push(vuln);
            }
          }
          results[component.purl] = componentVulns;
        }

      } catch (error) {
        console.error('Error querying OSV API:', error);
      }
    }
    
    return results;
  }

  async count(): Promise<number> {
    return this.vulnRepository.count();
  }
}
