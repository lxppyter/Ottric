import { Test, TestingModule } from '@nestjs/testing';
import { VulnService } from './vuln.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vulnerability } from './entities/vulnerability.entity';
import axios from 'axios';
import { Component } from '../sbom/entities/component.entity';

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
      { purl: 'pkg:npm/axios@0.21.1', name: 'axios', version: '0.21.1' } as Component,
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
                   { type: 'CVSS_V3', score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' }
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
        { purl: 'pkg:npm/safe-package@1.0.0', name: 'safe', version: '1.0.0' } as Component,
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
});
