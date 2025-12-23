import { Injectable } from '@nestjs/common';
import { SbomService } from './sbom/sbom.service';
import { VulnService } from './vuln/vuln.service';
import { VexService } from './vex/vex.service';

@Injectable()
export class AppService {
  constructor(
    private sbomService: SbomService,
    private vulnService: VulnService,
    private vexService: VexService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDashboardStats(organizationId: string) {
    if (!organizationId) {
      return {
        activeReleases: 0,
        criticalVulns: 0,
        vexResolved: 0,
        systemStatus: 'NO_ORGANIZATION',
        recentVex: [],
        recentIngestions: [],
      };
    }

    const [
      totalSbom,
      totalCritical,
      totalVex,
      resolvedVex,
      recentVex,
      recentSbom,
    ] = await Promise.all([
      this.sbomService.count(organizationId),
      this.vexService.countCritical(organizationId),
      this.vexService.count(organizationId),
      this.vexService.countResolved(organizationId),
      this.vexService.findRecent(organizationId),
      this.sbomService.findRecent(organizationId),
    ]);

    return {
      activeReleases: totalSbom,
      criticalVulns: totalCritical,
      vexResolved: resolvedVex,
      systemStatus: 'OPERATIONAL',
      recentVex: recentVex.map((v) => ({
        id: v.vulnerability.id,
        severity: v.vulnerability.severity || 'MEDIUM', // Fallback
        pkg: v.componentPurl?.split('/').pop()?.split('@')[0] || 'unknown',
        status: v.status,
        // time: 'recently' // No timestamp on VEX yet
      })),
      recentIngestions: recentSbom.map((s) => ({
        product: s.release?.product?.name || 'Unknown',
        version: s.release?.version || 'latest',
        timestamp: s.createdAt,
      })),
    };
  }
}
