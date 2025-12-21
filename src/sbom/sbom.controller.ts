import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Get, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SbomService } from './sbom.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('sbom')
@Controller('sbom')
export class SbomController {
  constructor(
    private readonly sbomService: SbomService,
    private readonly productsService: ProductsService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MEMBER)
  @ApiOperation({ summary: 'Upload SBOM', description: 'Upload CycloneDX JSON/XML file' })
// ... annotations ...
  @UseInterceptors(FileInterceptor('file'))
  async uploadSbom(@UploadedFile() file: any, @Req() req) {
    if (!file) throw new BadRequestException('File is required');
    
    try {
        const content = JSON.parse(file.buffer.toString());
        
        // Extract Metadata from SBOM if available
        const metadata = content.metadata || {};
        const component = metadata.component || {};
        
        const productName = component.name || 'Uploaded Project';
        const version = component.version || '1.0.0'; // Default version

        // Ensure Product and Release exist for this user
        const product = await this.productsService.ensureProduct(productName, req.user.id);
        const release = await this.productsService.createRelease(product, version);
        
        const sbom = await this.sbomService.ingestSbom(release, content);

        // Trigger Notifications
        this.notificationsService.dispatch(req.user.id, 'sbom.ingested', {
            product: product.name,
            version: release.version,
            sbomId: sbom.id,
            source: 'dashboard_upload'
        });

        return sbom;
    } catch (e) {
        throw new BadRequestException('Invalid JSON or Ingestion Failed: ' + e.message);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getRecentUploads(@Req() req) {
      return this.sbomService.findRecent(req.user.organizationId);
  }
}
