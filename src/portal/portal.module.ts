import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { VexStatement } from '../vex/entities/vex-statement.entity';
import { Sbom } from '../sbom/entities/sbom.entity';
import { ReportService } from './report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, VexStatement, Sbom])],
  controllers: [PortalController],
  providers: [PortalService, ReportService],
})
export class PortalModule {}
