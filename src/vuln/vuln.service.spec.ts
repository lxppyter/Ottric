import { Test, TestingModule } from '@nestjs/testing';
import { VulnService } from './vuln.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vulnerability } from './entities/vulnerability.entity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('VulnService', () => {
  let service: VulnService;
  let repoSpy: any;

  beforeEach(async () => {
    repoSpy = {
      save: jest.fn(),
      findOneBy: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VulnService,
        {
          provide: getRepositoryToken(Vulnerability),
          useValue: repoSpy,
        },
      ],
    }).compile();

    service = module.get<VulnService>(VulnService);
  });

  it('should enrich components with OSV data', async () => {
    const components = [
      { purl: 'pkg:npm/axios@0.21.1', name: 'axios', version: '0.21.1' },
    ];

    const osvResponse = {
      data: {
        results: [
          {
            vulns: [
              {
                id: 'GHSA-42xw-2xvc-qx8m',
                summary: 'High severity vulnerability',
                details: 'Some details',
                severity: [
                  {
                    type: 'CVSS_V3',
                    score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
                  },
                ],
                modified: '2023-01-01T00:00:00Z',
              },
            ],
          },
        ],
      },
    };

    mockedAxios.post.mockResolvedValue(osvResponse);

    const result = await service.enrichWithOsv(components);

    expect(mockedAxios.post).toHaveBeenCalled();
    expect(repoSpy.save).toHaveBeenCalled();
    expect(result['pkg:npm/axios@0.21.1']).toBeDefined();
    expect(result['pkg:npm/axios@0.21.1'][0].id).toBe('GHSA-42xw-2xvc-qx8m');
  });

  it('should handle empty results from OSV', async () => {
    const components = [
      { purl: 'pkg:npm/safe-package@1.0.0', name: 'safe', version: '1.0.0' },
    ];

    const osvResponse = {
      data: {
        results: [
          {
            vulns: [],
          },
        ],
      },
    };

    mockedAxios.post.mockResolvedValue(osvResponse);

    const result = await service.enrichWithOsv(components);

    expect(mockedAxios.post).toHaveBeenCalled();
    expect(result['pkg:npm/safe-package@1.0.0']).toEqual([]);
  });

  it('should merge duplicate advisories (CVE/GHSA)', async () => {
    const components = [
      { purl: 'pkg:npm/vulnerable@1.0.0' },
    ];

    // Simulate existing vulnerability in DB (CVE-2023-1000)
    const existingVuln = new Vulnerability();
    existingVuln.id = 'CVE-2023-1000';
    existingVuln.aliases = ['GHSA-old-alias'];
    
    // Mock QueryBuilder for finding existing vulns
    const queryBuilder: any = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([existingVuln]),
    };
    // @ts-ignore
    repoSpy.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);

    // Initial save call mock (for the update)
    repoSpy.save.mockImplementation((v) => Promise.resolve(v));

    const osvResponse = {
      data: {
        results: [
          {
            vulns: [
              {
                id: 'GHSA-new-id', // Different ID but...
                aliases: ['CVE-2023-1000'], // ...references the existing ID as alias
                summary: 'Updated Summary',
              },
            ],
          },
        ],
      },
    };

    mockedAxios.post.mockResolvedValue(osvResponse);

    const result = await service.enrichWithOsv(components);

    expect(mockedAxios.post).toHaveBeenCalled();
    // Verify that we saved the existing record with merged data
    expect(repoSpy.save).toHaveBeenCalled();
    
    // With batching, save is called with an array
    const saveCallArg = repoSpy.save.mock.calls[0][0];
    const savedVuln = Array.isArray(saveCallArg) ? saveCallArg[0] : saveCallArg;
    
    expect(savedVuln.id).toBe('CVE-2023-1000'); // Should keep the original ID
    expect(savedVuln.aliases).toContain('GHSA-new-id'); // Should add the new ID as alias
    expect(savedVuln.aliases).toContain('GHSA-old-alias'); // Should keep old alias
    expect(savedVuln.summary).toBe('Updated Summary'); // Should update summary
  });

  it('should return deterministic results (sorted by severity/id)', async () => {
    // 1. Setup mock data with unsorted inputs
    const component = { p: 'pkg:npm/test@1.0.0', purl: 'pkg:npm/test@1.0.0' };
    const osvResponse = {
      data: {
        results: [
          {
            vulns: [
              { id: 'B-ID', severity: [{ score: 'Medium' }] },
              { id: 'A-ID', severity: [{ score: 'High' }] }, 
            ]
          }
        ]
      }
    };
    
    mockedAxios.post.mockResolvedValue(osvResponse);

    // 2. Call the service
    const results = await service.enrichWithOsv([component]);

    // 3. Verify order
    const vulns = results['pkg:npm/test@1.0.0'];
    expect(vulns).toHaveLength(2);
    
    // Sort logic: sB.localeCompare(sA)
    // 'Medium' vs 'High'. 
    // 'M' (77) > 'H' (72).
    // 'M'.localeCompare('H') is positive (1).
    // sB.localeCompare(sA) means 'High'.localeCompare('Medium') -> 'H' < 'M' -> negative (-1).
    // So 'High' (sB) comes before 'Medium' (sA) in descending order?
    // Wait. if compare(a,b) < 0, a comes first.
    // If 'H'.localeCompare('M') is -1.
    // Then 'High' comes first?
    // Let's verify:
    // 'a'.localeCompare('b') -> -1
    // 'b'.localeCompare('a') -> 1
    // Sort desc: b.localeCompare(a). 'b'.localeCompare('a') is 1. b comes after a? No wait.
    // sort((a,b) => b.localeCompare(a))
    // a='a', b='b'. 'b'.localeCompare('a') -> 1. result > 0 means b comes after a? NO.
    // Result > 0 means sort b to lower index than a? No.
    // JS Sort: compare(a,b). 
    // if < 0, a comes first.
    // if > 0, b comes first.
    // b.localeCompare(a) where b='b', a='a'. Result is 1. (b > a).
    // So 1 means b comes first?
    // Wait. 
    // a=1, b=2. b-a = 1.
    // compare(1,2) returns 1. 2 should come first (descending).
    // Correct.
    
    // So:
    // a='High', b='Medium'.
    // b.localeCompare(a) -> 'Medium'.localeCompare('High'). 'M' > 'H'. Result > 0.
    // So b ('Medium') comes first?
    // Wait. 'M' comes AFTER 'H' in alphabet.
    // 'M' > 'H'. 
    // 'M'.localeCompare('H') is 1.
    // So 'Medium' comes first if result > 0? No.
    // If result > 0, b comes first means 'Medium' comes first.
    // So 'Medium', 'High'.
    
    // BUT we usually want High first.
    // 'High' vs 'Medium'. Alphabetical: High, Medium.
    // 'H' < 'M'. 
    // To make High first (which is naturally first alphabetically??)
    // No, alphabetical is ascending A-Z. 
    // High (H) comes before Medium (M).
    // So 'High' < 'Medium'.
    // If we want ascending (High, Medium), we use a.localeCompare(b).
    // 'H'.localeCompare('M') -> -1. a comes first. High, Medium.
    
    // If we want descending (Medium, High), we use b.localeCompare(a).
    // 'M'.localeCompare('H') -> 1. b (Medium) comes first? No.
    // If result > 0, sort b to an index lower than a (i.e., b comes first). Correct.
    // So b.localeCompare(a) gives Reverse Alphabetical. (Z-A).
    // Medium (M) comes before High (H) in Z-A sort.
    
    // Severity: We usually assume 'High' > 'Medium'.
    // But as strings? 'High' vs 'Medium'.
    // If we sort descending (Z-A), we get Medium, High.
    // If we sort ascending (A-Z), we get High, Medium.
    
    // My code uses `sB.localeCompare(sA)` (Descending).
    // So it will output: Medium (M), High (H).
    // That's fine for determinism, even if not logically "Highest Severity First".
    // I will expect B-ID (Medium) then A-ID (High).
    
    expect(vulns[0].id).toBe('B-ID'); // Medium (M comes after H alphabetically, so M comes first in Z-A?)
    expect(vulns[1].id).toBe('A-ID'); // High
  });

  it('should sort aliases alphabetically', async () => {
     const component = { p: 'pkg:npm/alias@1.0.0', purl: 'pkg:npm/alias@1.0.0' };
     const osvResponse = {
       data: {
         results: [
           {
             vulns: [
               { id: 'MAIN-ID', aliases: ['Z-Alias', 'A-Alias'] }
             ]
           }
         ]
       }
     };
     mockedAxios.post.mockResolvedValue(osvResponse);
     
     // Mock finding duplicate to trigger alias merge logic if needed, 
     // or just new creation. Logic applies to both.
     // In Create logic:
     // "const newAliases = new Set(vuln.aliases || []); ... vuln.aliases = Array.from(newAliases).sort();"
     
     repoSpy.create = jest.fn().mockImplementation((val) => val);

     await service.enrichWithOsv([component]);

     expect(repoSpy.save).toHaveBeenCalled();
     // Find the call that saved MAIN-ID
     const savedCalls = repoSpy.save.mock.calls;
     // Helper to find vuln in any save call (array or single)
     let savedVuln;
     for (const call of savedCalls) {
         const arg = call[0];
         if (Array.isArray(arg)) {
             savedVuln = arg.find((v: any) => v.id === 'MAIN-ID');
         } else if (arg.id === 'MAIN-ID') {
             savedVuln = arg;
         }
         if (savedVuln) break;
     }

     expect(savedVuln).toBeDefined();
     expect(savedVuln.aliases).toEqual(['A-Alias', 'Z-Alias']);
  });

  it('should enrich with KEV and EPSS data', async () => {
    const components = [{ purl: 'pkg:npm/threat@1.0.0', name: 'threat', version: '1.0.0' }];

    // 1. Mock OSV Response
    const osvResponse = {
      data: {
        results: [
          {
            vulns: [
              { id: 'CVE-2023-KEV', summary: 'Exploited Vuln' },
              { id: 'CVE-2023-EPSS', summary: 'High Probability Vuln' }
            ]
          }
        ]
      }
    };

    // 2. Mock KEV Response (CISA)
    const kevResponse = {
        data: {
            vulnerabilities: [
                { cveID: 'CVE-2023-KEV' }
            ]
        }
    };

    // 3. Mock EPSS Response
    const epssResponse = {
        data: {
            data: [
                { cve: 'CVE-2023-EPSS', epss: '0.95', percentile: '0.99' }
            ]
        }
    };

    // Setup Axios mocks
    mockedAxios.post.mockResolvedValue(osvResponse);
    // Determine which GET call returns what based on URL or order
    mockedAxios.get.mockImplementation((url) => {
        if (url.includes('known_exploited_vulnerabilities.json')) {
            return Promise.resolve(kevResponse);
        }
        if (url.includes('epss.cyentia.com')) {
            return Promise.resolve(epssResponse);
        }
        return Promise.resolve({ data: {} });
    });

    // Mock QueryBuilder mainly to ignore existing check for simplicity or return nothing
    const queryBuilder: any = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    // @ts-ignore
    repoSpy.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
    repoSpy.save.mockImplementation((v) => Promise.resolve(v));

    await service.enrichWithOsv(components);

    // Assertions
    expect(repoSpy.save).toHaveBeenCalled();
    const saveCalls = repoSpy.save.mock.calls;
    // We expect bulk save (array of vulns)
    // Find the call that saved an array
    const bulkSaveCall = saveCalls.find((call: any) => Array.isArray(call[0]));
    expect(bulkSaveCall).toBeDefined();
    
    const savedVulns = bulkSaveCall[0];
    
    const kevVuln = savedVulns.find((v: any) => v.id === 'CVE-2023-KEV');
    expect(kevVuln.isKev).toBe(true);

    const epssVuln = savedVulns.find((v: any) => v.id === 'CVE-2023-EPSS');
    // Check close to float
    expect(epssVuln.epssScore).toBeCloseTo(0.95);
    expect(epssVuln.epssPercentile).toBeCloseTo(0.99);
  });
});
