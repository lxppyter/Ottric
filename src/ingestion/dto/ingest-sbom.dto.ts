import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngestSbomDto {
  @ApiProperty({ example: 'MyProduct', description: 'Name of the product' })
  @IsString()
  productName: string;

  @ApiProperty({ example: '1.0.0', description: 'Version of the release' })
  @IsString()
  version: string;

  @ApiProperty({ example: '85ed...', description: 'Git Commit SHA', required: false })
  @IsString()
  @IsOptional()
  commitSha?: string;

  @ApiProperty({ example: 'build-123', description: 'CI Build ID', required: false })
  @IsString()
  @IsOptional()
  buildId?: string;

  @ApiProperty({ example: 'sha256:...', description: 'Container Image Digest', required: false })
  @IsString()
  @IsOptional()
  imageDigest?: string;

  @ApiProperty({ example: 'linux/amd64', description: 'Platform/Architecture', required: false })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiProperty({ description: 'CycloneDX JSON Content' })
  @IsObject()
  sbom: any;
}
