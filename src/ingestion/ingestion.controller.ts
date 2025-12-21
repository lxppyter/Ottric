import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { IngestSbomDto } from './dto/ingest-sbom.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Ingestion')
@Controller('ingest')
@UseGuards(AuthGuard(['jwt', 'api-key']))
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('sbom')
  @ApiOperation({ summary: 'Ingest SBOM', description: 'Upload a CycloneDX JSON SBOM for a product version.' })
  async ingestSbom(@Body() dto: IngestSbomDto, @Req() req) {
    return this.ingestionService.ingest(dto, req.user.id);
  }
}
