import { IsEnum, IsString, IsOptional } from 'class-validator';
import { VexStatus } from '../entities/vex-statement.entity';

export class UpdateVexStatusDto {
  @IsEnum(VexStatus)
  status: VexStatus;

  @IsString()
  @IsOptional()
  justification?: string;
}
