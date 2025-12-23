import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sbom } from './entities/sbom.entity';
import { SbomService } from './sbom.service';
import { SbomController } from './sbom.controller';

import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VexModule } from '../vex/vex.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sbom]),
    ProductsModule,
    NotificationsModule,
    forwardRef(() => VexModule),
  ],
  controllers: [SbomController],
  providers: [SbomService],
  exports: [TypeOrmModule, SbomService],
})
export class SbomModule {}
