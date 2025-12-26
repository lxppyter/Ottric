import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vulnerability } from './entities/vulnerability.entity';
import { VulnService } from './vuln.service';
import { RiskService } from './risk.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vulnerability])],
  providers: [VulnService, RiskService],
  exports: [TypeOrmModule, VulnService, RiskService],
})
export class VulnModule {}
