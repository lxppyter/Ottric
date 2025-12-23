import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VexStatement } from './entities/vex-statement.entity';
import { VexService } from './vex.service';
import { VexController } from './vex.controller';
import { VulnModule } from '../vuln/vuln.module';
import { SbomModule } from '../sbom/sbom.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VexStatement]),
    VulnModule,
    forwardRef(() => SbomModule),
  ],
  controllers: [VexController],
  providers: [VexService],
  exports: [TypeOrmModule, VexService],
})
export class VexModule {}
