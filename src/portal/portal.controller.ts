import { Controller, Get, Param, Res, UseGuards, Req, Header, StreamableFile } from '@nestjs/common';
import { PortalService } from './portal.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportService } from './report.service';
import type { Response } from 'express';

@ApiTags('Portal')
@Controller('portal')
export class PortalController {
  constructor(
      private readonly portalService: PortalService,
      private readonly reportService: ReportService
  ) {}

  @Get('projects')
  @ApiOperation({ summary: 'List Projects', description: 'Get all projects for the organization with summary stats.' })
  @UseGuards(JwtAuthGuard)
  async getProjects(@Req() req) {
      return this.portalService.getProjects(req.user.organizationId);
  }

  @Get(':product/versions')
  @ApiOperation({ summary: 'List Versions', description: 'Get all versions for a product.' })
  @UseGuards(JwtAuthGuard)
  async getVersions(@Param('product') product: string) {
      return this.portalService.getProductVersions(product);
  }

  @Get(':product/:version/sbom')
  @ApiOperation({ summary: 'Download SBOM', description: 'Get the ingested SBOM JSON.' })
  async downloadSbom(
      @Param('product') product: string, 
      @Param('version') version: string
  ) {
    return this.portalService.getSbom(product, version);
  }

  @Get(':product/:version/vex')
  @ApiOperation({ summary: 'Get VEX Statements', description: 'List all VEX statements for this version.' })
  async downloadVex(
    @Param('product') product: string, 
    @Param('version') version: string
  ) {
    return this.portalService.getVex(product, version);
  }
  @Get(':product/:version/audit-pack')
  @ApiOperation({ summary: 'Get Analysis Result', description: 'Get full audit pack (Scorecard, VEX, SBOM summary).' })
  async getAuditPack(
    @Param('product') product: string, 
    @Param('version') version: string
  ) {
    return this.portalService.getAuditPack(product, version);
  }

  @Get(':product/:version/report')
  @ApiOperation({ summary: 'Download PDF Report', description: 'Download Security Audit Report as PDF.' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="report.pdf"')
  async getReport(
      @Param('product') product: string,
      @Param('version') version: string,
      @Res({ passthrough: true }) res: Response
  ) {
      const auditPack = await this.portalService.getAuditPack(product, version);
      const buffer = await this.reportService.generateReport(auditPack);
      
      res.set({
          'Content-Disposition': `attachment; filename="${product}-${version}-report.pdf"`,
      });
      
      return new StreamableFile(buffer);
  }
}
