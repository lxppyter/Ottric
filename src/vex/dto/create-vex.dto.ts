import { IsString, IsEnum, IsOptional } from 'class-validator';
import { VexStatus } from '../entities/vex-statement.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVexDto {
  @ApiProperty()
  @IsString()
  vulnerabilityId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiProperty({ enum: VexStatus })
  @IsEnum(VexStatus)
  status: VexStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  justification?: string;
}
