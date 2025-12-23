import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VexStatus } from '../entities/vex-statement.entity';

export class BulkUpdateVexDto {
  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @ApiProperty({ enum: VexStatus })
  @IsEnum(VexStatus)
  status: VexStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  justification?: string;
}
