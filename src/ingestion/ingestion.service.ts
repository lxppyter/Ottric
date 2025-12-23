import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { SbomService } from '../sbom/sbom.service';
import { VexService } from '../vex/vex.service';
import { IngestSbomDto } from './dto/ingest-sbom.dto';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class IngestionService {
  constructor(
    private productsService: ProductsService,
    private sbomService: SbomService,
    private vexService: VexService,
    private notificationsService: NotificationsService,
  ) {}

  async ingest(dto: IngestSbomDto, userId: string) {
    const product = await this.productsService.ensureProduct(
      dto.productName,
      userId,
    );
    const release = await this.productsService.createRelease(
      product,
      dto.version,
      dto.commitSha,
      dto.buildId,
      dto.imageDigest,
      dto.platform,
    );
    const sbom = await this.sbomService.ingestSbom(release, dto.sbom);
    await this.vexService.correlate(sbom);

    // Trigger Notifications
    this.notificationsService.dispatch(userId, 'sbom.ingested', {
      product: product.name,
      version: release.version,
      sbomId: sbom.id,
    });

    return sbom;
  }
}
