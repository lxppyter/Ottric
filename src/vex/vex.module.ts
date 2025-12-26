import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VexStatement } from './entities/vex-statement.entity';
import { VexService } from './vex.service';
import { VexController } from './vex.controller';
import { VulnModule } from '../vuln/vuln.module';
import { SbomModule } from '../sbom/sbom.module';
import { AnalysisModule } from '../analysis/analysis.module';

import { AutomationModule } from '../automation/automation.module';
import { ProductsModule } from '../products/products.module';
import { PolicyModule } from '../policies/policy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VexStatement]),
    VulnModule,
    AnalysisModule,
    PolicyModule,
    forwardRef(() => SbomModule),
    forwardRef(() => AutomationModule),
    ProductsModule,
  ],
  controllers: [VexController],
  providers: [VexService],
  exports: [TypeOrmModule, VexService],
})
export class VexModule {}
