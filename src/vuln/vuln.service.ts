import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vulnerability } from './entities/vulnerability.entity';

interface GenericComponent {
  purl?: string;
  // Add other fields if needed for enrichment later
}

import { PurlUtils } from '../common/utils/purl.utils';

@Injectable()
export class VulnService {
  constructor(
    @InjectRepository(Vulnerability)
    private vulnRepository: Repository<Vulnerability>,
  ) {}




  // Simple in-memory cache for KEV
  private kevCache: Set<string> | null = null;
  private kevLastUpdated: Date | null = null;

  async enrichWithOsv(
    components: GenericComponent[],
  ): Promise<Record<string, Vulnerability[]>> {
    const componentsWithPurls = components
      .filter((c) => c.purl)
      .map(c => ({ 
         ...c, 
         purl: PurlUtils.normalize(c.purl!) 
      }));

    if (componentsWithPurls.length === 0) return {};

    const batchSize = 1000;
    const results: Record<string, Vulnerability[]> = {};

    for (let i = 0; i < componentsWithPurls.length; i += batchSize) {
      const batch = componentsWithPurls.slice(i, i + batchSize);

      const payload = {
        queries: batch.map((c) => ({
          package: { purl: c.purl },
        })),
      };

      try {
        const response = await axios.post(
          'https://api.osv.dev/v1/querybatch',
          payload,
        );
        const batchResults = response.data.results;

        // Collect all IDs and aliases from the batch to efficiently query existing records
        const allIds = new Set<string>();
        for (const res of batchResults) {
          if (res.vulns) {
            for (const v of res.vulns) {
              allIds.add(v.id);
              if (v.aliases) {
                v.aliases.forEach((a: string) => allIds.add(a));
              }
            }
          }
        }

        const vulnMap = new Map<string, Vulnerability>();
        const vulnsToSave = new Map<string, Vulnerability>(); // Keyed by canonical ID

        if (allIds.size > 0) {
          const allIdsArray = Array.from(allIds);
          
          const existingVulns = await this.vulnRepository
            .createQueryBuilder('vuln')
            .where('vuln.id IN (:...ids)', { ids: allIdsArray })
            .orWhere('vuln.aliases && :ids', { ids: allIdsArray })
            .getMany();

          existingVulns.forEach((v) => {
             vulnMap.set(v.id, v);
             if (v.aliases) {
                 v.aliases.forEach(a => vulnMap.set(a, v));
             }
          });
        }

        // Pass 1: Create/Update Vulnerability Objects in Memory
        for (let j = 0; j < batchResults.length; j++) {
            const result = batchResults[j];
            const component = batch[j];
            const componentVulns: Vulnerability[] = [];

            if (result.vulns && result.vulns.length > 0) {
              for (const osvVuln of result.vulns) {
                let existing = vulnMap.get(osvVuln.id);
                if (!existing && osvVuln.aliases) {
                    for (const alias of osvVuln.aliases) {
                        existing = vulnMap.get(alias);
                        if (existing) break;
                    }
                }

                const vuln = existing || new Vulnerability();
                if (!existing) {
                    vuln.id = osvVuln.id;
                }

                vuln.summary = osvVuln.summary || vuln.summary;
                vuln.details = osvVuln.details || vuln.details;
                vuln.modified = osvVuln.modified
                  ? new Date(osvVuln.modified)
                  : vuln.modified;
                
                const newAliases = new Set(vuln.aliases || []);
                if (osvVuln.aliases) {
                    osvVuln.aliases.forEach((a: string) => newAliases.add(a));
                }
                if (existing && existing.id !== osvVuln.id) {
                    newAliases.add(osvVuln.id);
                }
                vuln.aliases = Array.from(newAliases).sort();

                vuln.references = osvVuln.references || [];
                vuln.affectedPackages = osvVuln.affected || [];

                let hasFix = false;
                const fixedVersions: string[] = [];
                if (osvVuln.affected) {
                  for (const affected of osvVuln.affected) {
                      if (affected.ranges) {
                          for (const range of affected.ranges) {
                              if (range.events) {
                                  for (const event of range.events) {
                                      if (event.fixed) {
                                          hasFix = true;
                                          fixedVersions.push(event.fixed);
                                      }
                                  }
                              }
                          }
                      }
                  }
                }
                vuln.hasFix = hasFix;
                vuln.fixedIn = fixedVersions.length > 0 ? fixedVersions.join(', ') : null;

                if (osvVuln.severity && osvVuln.severity.length > 0) {
                  vuln.severity =
                    osvVuln.severity[0].score || osvVuln.severity[0].type;
                } else if (osvVuln.database_specific && osvVuln.database_specific.severity) {
                    vuln.severity = osvVuln.database_specific.severity;
                }

                // Check if we need to fetch full details (if batch result was "thin")
                if (!vuln.severity && !vuln.summary && !vuln.details) {
                    // It's likely a thin object. We should fetch details.
                    // We can't do await here easily without blocking. 
                    // Let's mark it for hydration.
                    (vuln as any)._needsHydration = true;
                }

                // Add to map for saving later
                vulnsToSave.set(vuln.id, vuln);
                
                // Update lookup map for subsequent items
                vulnMap.set(vuln.id, vuln);
                if (vuln.aliases) {
                    vuln.aliases.forEach(a => vulnMap.set(a, vuln));
                }

                componentVulns.push(vuln);
              }
            }
            if (component.purl) {
              results[component.purl] = componentVulns; 
            }
        }

        // Pass 1.5: Hydrate thin vulnerabilities
        const vulnsToHydrate = Array.from(vulnsToSave.values()).filter((v: any) => v._needsHydration);
        if (vulnsToHydrate.length > 0) {
            console.log(`Hydrating ${vulnsToHydrate.length} thin vulnerabilities...`);
            // Process in chunks to avoid overwhelming API
            const hydrationChunkSize = 10;
            for (let k = 0; k < vulnsToHydrate.length; k += hydrationChunkSize) {
                const chunk = vulnsToHydrate.slice(k, k + hydrationChunkSize);
                await Promise.all(chunk.map(async (v) => {
                    try {
                        const detailRes = await axios.get(`https://api.osv.dev/v1/vulns/${v.id}`);
                        const fullData = detailRes.data;
                        
                        v.summary = fullData.summary || v.summary;
                        v.details = fullData.details || v.details;
                        v.modified = fullData.modified ? new Date(fullData.modified) : v.modified;
                        
                        // Merge aliases
                        const newAliases = new Set(v.aliases || []);
                        if (fullData.aliases) fullData.aliases.forEach(a => newAliases.add(a));
                        v.aliases = Array.from(newAliases).sort();
                        
                        v.references = fullData.references || v.references;
                        v.affectedPackages = fullData.affected || v.affectedPackages;

                        // Fix Logic (Same as before)
                        let hasFix = false;
                        const fixedVersions: string[] = [];
                        if (fullData.affected) {
                            for (const affected of fullData.affected) {
                                if (affected.ranges) {
                                    for (const range of affected.ranges) {
                                        if (range.events) {
                                            for (const event of range.events) {
                                                if (event.fixed) {
                                                    hasFix = true;
                                                    fixedVersions.push(event.fixed);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        v.hasFix = hasFix;
                        v.fixedIn = fixedVersions.length > 0 ? fixedVersions.join(', ') : null;

                        // Severity Logic (Standard + Fallback)
                        if (fullData.severity && fullData.severity.length > 0) {
                             v.severity = fullData.severity[0].score || fullData.severity[0].type;
                        } else if (fullData.database_specific && fullData.database_specific.severity) {
                             v.severity = fullData.database_specific.severity;
                        }

                        delete (v as any)._needsHydration;
                    } catch (e) {
                        console.error(`Failed to hydrate ${v.id}`, e.message);
                    }
                }));
            }
        }

        // Pass 2: Bulk Enrich and Save
        const distinctVulns = Array.from(vulnsToSave.values());
        if (distinctVulns.length > 0) {
            await this.enrichWithKev(distinctVulns);
            await this.enrichWithEpss(distinctVulns);
            await this.vulnRepository.save(distinctVulns);
        }

        // Pass 3: Sort results (Deterministic)
        for (const purl in results) {
            results[purl].sort((a, b) => {
                const sA = a.severity || '';
                const sB = b.severity || '';
                if (sA !== sB) return sB.localeCompare(sA); 
                return a.id.localeCompare(b.id);
            });
        }

      } catch (error) {
        console.error('Error querying OSV API:', error);
      }
    }

    return results;
  }

  async enrichWithKev(vulns: Vulnerability[]) {
    try {
        // Cache KEV for 1 hour
        const oneHour = 60 * 60 * 1000;
        if (!this.kevCache || !this.kevLastUpdated || (Date.now() - this.kevLastUpdated.getTime() > oneHour)) {
            console.log('Fetching CISA KEV catalog...');
            try {
                const response = await axios.get('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': 'https://www.cisa.gov/',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                this.kevCache = new Set();
                if (response.data && response.data.vulnerabilities) {
                    for (const v of response.data.vulnerabilities) {
                    if (v.cveID) this.kevCache.add(v.cveID);
                    }
                }
                this.kevLastUpdated = new Date();
             } catch (fetchErr) {
                 // console.warn('KEV fetch skipped (Network/Auth):', fetchErr.message);
                 if (!this.kevCache) this.kevCache = new Set(); 
             }
        }

        if (this.kevCache) {
             for (const vuln of vulns) {
                if (this.kevCache.has(vuln.id)) {
                    vuln.isKev = true;
                } else if (vuln.aliases) {
                    if (vuln.aliases.some(alias => this.kevCache!.has(alias))) {
                        vuln.isKev = true;
                    }
                }
            }
        }
    } catch (e) {
        // Outer catch just in case logic fails
        console.error('Error in enrichWithKev process:', e);
    }
  }

  async enrichWithEpss(vulns: Vulnerability[]) {
    // Determine which vulns need EPSS (usually CVEs)
    const cveVulns = vulns.filter(v => v.id.startsWith('CVE-'));
    // Also consider aliases if main ID is not CVE? 
    // EPSS API takes CVEs. If main ID is GHSA but has a CVE alias, we should check that CVE.
    
    // Map CVE -> Vuln object(s)
    const cveMap = new Map<string, Vulnerability[]>();

    for (const v of vulns) {
        const cvesToCheck: string[] = [];
        if (v.id.startsWith('CVE-')) cvesToCheck.push(v.id);
        if (v.aliases) {
            v.aliases.filter(a => a.startsWith('CVE-')).forEach(a => cvesToCheck.push(a));
        }

        cvesToCheck.forEach(cve => {
            if (!cveMap.has(cve)) cveMap.set(cve, []);
            cveMap.get(cve)!.push(v);
        });
    }

    const allCves = Array.from(cveMap.keys());
    if (allCves.length === 0) return;

    // chunking (URL length limit)
    const chunkSize = 50; 
    for (let i = 0; i < allCves.length; i += chunkSize) {
        const chunk = allCves.slice(i, i + chunkSize);
        const url = `https://api.epss.cyentia.com/v1/epss?cve=${chunk.join(',')}`;
        
        try {
            const response = await axios.get(url);
            if (response.data && response.data.data) {
                // ... filtering logic ...
                for (const item of response.data.data) {
                    const affectedVulns = cveMap.get(item.cve);
                    if (affectedVulns) {
                        for (const v of affectedVulns) {
                            const score = parseFloat(item.epss);
                            const percentile = parseFloat(item.percentile);
                            if (!v.epssScore || score > v.epssScore) {
                                v.epssScore = score;
                                v.epssPercentile = percentile;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Silently ignore EPSS fetch errors (could be offline/DNS)
            // console.warn(`EPSS fetch failed for chunk: ${e.message}`);
        }
    }
  }

  async count(): Promise<number> {
    return this.vulnRepository.count();
  }
}
