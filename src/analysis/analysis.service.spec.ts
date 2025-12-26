import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from './analysis.service';
import { Sbom } from '../sbom/entities/sbom.entity';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalysisService],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  it('should detect imported packages', async () => {
    const sbom = {
        content: {
            components: [
                { name: 'axios', purl: 'pkg:npm/axios@1.0.0' },
                { name: 'lodash', purl: 'pkg:npm/lodash@4.0.0' },
                { name: 'unused-lib', purl: 'pkg:npm/unused-lib@1.0.0' }
            ]
        }
    } as Sbom;

    const projectPath = path.join('mock', 'project');
    const srcPath = path.join(projectPath, 'src');

    // Mock FS
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readdirSync as jest.Mock).mockImplementation((dir) => {
        if (dir === projectPath) return ['src'];
        if (dir === srcPath) return ['index.ts', 'utils.ts'];
        return [];
    });
    (fs.statSync as jest.Mock).mockImplementation((p) => ({
        isDirectory: () => p === srcPath ||  p === projectPath, // strict check might be safer or just checks
        isFile: () => p.endsWith('.ts'),
    }));

    (fs.readFileSync as jest.Mock).mockImplementation((p) => {
        if (p.endsWith('index.ts')) {
            return `
                import axios from 'axios';
                const _ = require('lodash');
                console.log('hello');
            `;
        }
        if (p.endsWith('utils.ts')) {
            return `
                import { map } from 'lodash/fp';
                export const test = () => {};
            `;
        }
        return '';
    });

    const result = await service.analyzeReachability(projectPath, sbom);

    expect(result.size).toBe(2);
    expect(result.has('axios')).toBe(true);
    expect(result.has('lodash')).toBe(true);
    expect(result.has('unused-lib')).toBe(false);

    expect(result.get('axios')).toContain(path.join(srcPath, 'index.ts'));
    // lodash is used in both
    const lodashFiles = result.get('lodash');
    expect(lodashFiles).toContain(path.join(srcPath, 'index.ts'));
    expect(lodashFiles).toContain(path.join(srcPath, 'utils.ts'));
  });
});
