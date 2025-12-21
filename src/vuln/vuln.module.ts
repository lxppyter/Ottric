import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vulnerability } from './entities/vulnerability.entity';
import { VulnService } from './vuln.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vulnerability])],
  providers: [VulnService],
  exports: [TypeOrmModule, VulnService],
})
export class VulnModule {}
