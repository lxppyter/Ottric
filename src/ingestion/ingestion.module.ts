import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { ProductsModule } from '../products/products.module';
import { SbomModule } from '../sbom/sbom.module';
import { VexModule } from '../vex/vex.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ProductsModule, SbomModule, VexModule, NotificationsModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
