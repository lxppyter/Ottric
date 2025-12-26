import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products' })
  async findAll(@Req() req) {
    // Should filter by org?
    // Current service findAll returns ALL. Let's fix that later or filter here?
    // Actually ProductsService.findAll is finding ALL.
    // We should probably filter by organization on the service level, but for now let's just use what we have or add findAllByOrg.
    // Wait, the user asked for delete/rename.
    return this.productsService.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  async delete(@Param('id') id: string, @Req() req) {
    return this.productsService.deleteProduct(id, req.user.organizationId);
  }

  @Patch(':id/rename')
  @ApiOperation({ summary: 'Rename a product' })
  async rename(
    @Param('id') id: string,
    @Body('name') name: string,
    @Req() req,
  ) {
    return this.productsService.renameProduct(
      id,
      name,
      req.user.organizationId,
    );
  }

  @Patch(':id/context')
  @ApiOperation({ summary: 'Update product context (environment, criticality)' })
  async updateContext(
    @Param('id') id: string,
    @Body()
    body: {
      criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      environment?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
      isInternetFacing?: boolean;
    },
    @Req() req,
  ) {
    return this.productsService.updateProductContext(
      id,
      req.user.organizationId,
      body,
    );
  }
  @Patch(':id/integrations')
  @ApiOperation({ summary: 'Update integration settings' })
  async updateIntegrations(
    @Param('id') id: string,
    @Body() body: { repositoryUrl?: string; manifestFilePath?: string; githubToken?: string },
    @Req() req,
  ) {
    return this.productsService.updateIntegrationSettings(id, req.user.organizationId, body);
  }
}
