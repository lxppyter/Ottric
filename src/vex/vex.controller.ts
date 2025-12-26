import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { VexService } from './vex.service';
import { UpdateVexStatusDto } from './dto/update-vex-status.dto';
import { CreateVexDto } from './dto/create-vex.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BulkUpdateVexDto } from './dto/bulk-update-vex.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Controller('vex')
export class VexController {
  constructor(private readonly vexService: VexService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get All Vex',
    description: 'List all VEX statements',
  })
  async getAllVex(@Query() query: PaginationDto, @Req() req) {
    return this.vexService.findAll(req.user.id, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create Vex',
    description: 'Create a new VEX statement',
  })
  async createVex(@Body() dto: CreateVexDto, @Req() req) {
    return this.vexService.create(dto, req.user.id);
  }

  @Patch('bulk-update')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Bulk Update Status',
    description: 'Update status for multiple VEX statements',
  })
  async bulkUpdate(@Body() dto: BulkUpdateVexDto, @Req() req) {
    return this.vexService.bulkUpdate(req.user.id, dto);
  }

  @Get('product/:productId')
  // Keeping GET public for dashboard visibility, or protect if needed.
  // For now let's protect everything.
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get Product Vex',
    description: 'List VEX statements with pagination and filtering',
  })
  async getProductVex(
    @Param('productId') productId: string,
    @Query() query: PaginationDto,
    @Req() req,
  ) {
    return this.vexService.findAllByProduct(productId, req.user.id, query);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateVexStatusDto,
    @Req() req,
  ) {
    try {
      return await this.vexService.updateStatus(id, req.user.id, dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
      summary: 'Get VEX History',
      description: 'Get audit trail for a VEX statement'
  })
  async getHistory(@Param('id') id: string) {
      return this.vexService.getHistory(id);
  }
  @Get('export/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Export VEX',
    description: 'Export VEX in CycloneDX format',
  })
  async export(@Param('productId') productId: string) {
    return this.vexService.export(productId);
  }
  @Get('product/:productId/activity')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get Project Activity',
    description: 'Get audit logs for all VEX statements in a project',
  })
  async getActivity(
    @Param('productId') productId: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.vexService.getProjectActivity(productId, Number(limit), Number(offset));
  }
}
