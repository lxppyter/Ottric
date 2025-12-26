import { Test, TestingModule } from '@nestjs/testing';
import { SbomService } from './sbom.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Sbom } from './entities/sbom.entity';
import { Release } from '../products/entities/release.entity';
import { BadRequestException } from '@nestjs/common';

describe('SbomService', () => {
  let service: SbomService;
  let sbomRepoSpy: any;
  let releaseRepoSpy: any;

  beforeEach(async () => {
    sbomRepoSpy = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
    };
    releaseRepoSpy = {
        save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SbomService,
        {
          provide: getRepositoryToken(Sbom),
          useValue: sbomRepoSpy,
        },
        {
            provide: getRepositoryToken(Release),
            useValue: releaseRepoSpy,
        },
      ],
    }).compile();

    service = module.get<SbomService>(SbomService);
  });

  it('should validate valid CycloneDX SBOM', async () => {
    const validSbom = {
        bomFormat: 'CycloneDX',
        specVersion: '1.4',
        components: []
    };
    const release = { id: '1' } as any;

    sbomRepoSpy.findOne.mockResolvedValue(null);
    sbomRepoSpy.create.mockReturnValue({ release, content: validSbom });
    sbomRepoSpy.save.mockResolvedValue({ id: '1', content: validSbom });

    await expect(service.ingestSbom(release, validSbom)).resolves.not.toThrow();
  });

  it('should reject invalid BOM format', async () => {
    const invalidSbom = {
        bomFormat: 'SPDX', // Not supported yet
        specVersion: '2.3',
    };
    const release = { id: '1' } as any;

    await expect(service.ingestSbom(release, invalidSbom)).rejects.toThrow(BadRequestException);
  });

  it('should reject missing specVersion', async () => {
    const invalidSbom = {
        bomFormat: 'CycloneDX',
        components: []
    };
    const release = { id: '1' } as any;

    await expect(service.ingestSbom(release, invalidSbom)).rejects.toThrow('Missing specVersion');
  });

  it('should reject empty components/metadata', async () => {
      const invalidSbom = {
          bomFormat: 'CycloneDX',
          specVersion: '1.4'
      };
      const release = { id: '1' } as any;
  
      await expect(service.ingestSbom(release, invalidSbom)).rejects.toThrow('SBOM must contain components or metadata');
  });
});
