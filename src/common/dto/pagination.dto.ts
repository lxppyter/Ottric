import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VexStatus } from '../../vex/entities/vex-statement.entity';

export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit: number = 10;

  @ApiProperty({ required: false, enum: VexStatus })
  @IsEnum(VexStatus)
  @IsOptional()
  status?: VexStatus;
}
