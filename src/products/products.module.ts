import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Release } from './entities/release.entity';
import { User } from '../users/entities/user.entity';
import { ProductsService } from './products.service';

import { BillingModule } from '../billing/billing.module';

import { ProductsController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Release, User]), BillingModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
