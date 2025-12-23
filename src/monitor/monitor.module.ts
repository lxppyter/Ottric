import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitorService } from './monitor.service';
import { ProductsModule } from '../products/products.module';
import { VulnModule } from '../vuln/vuln.module';
import { VexModule } from '../vex/vex.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SbomModule } from '../sbom/sbom.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ProductsModule,
    VulnModule,
    VexModule,
    NotificationsModule,
    SbomModule,
  ],
  providers: [MonitorService],
})
export class MonitorModule {}
