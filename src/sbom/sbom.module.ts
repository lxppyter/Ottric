import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sbom } from './entities/sbom.entity';
import { Component } from './entities/component.entity';
import { SbomService } from './sbom.service';
import { SbomController } from './sbom.controller';

import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sbom, Component]), ProductsModule, NotificationsModule],
  controllers: [SbomController],
  providers: [SbomService],
  exports: [TypeOrmModule, SbomService],
})
export class SbomModule {}
