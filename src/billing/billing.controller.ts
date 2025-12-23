import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionPlan } from '../users/entities/organization.entity';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription details' })
  async getCurrentSubscription(@Req() req) {
    return this.billingService.getCurrentSubscription(req.user.organizationId);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade subscription (Mock)' })
  async upgradeSubscription(@Req() req, @Body('plan') plan: SubscriptionPlan) {
    return this.billingService.upgradeSubscription(
      req.user.organizationId,
      plan,
    );
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get invoice history (Mock)' })
  async getInvoices(@Req() req) {
    return this.billingService.getInvoiceHistory(req.user.organizationId);
  }
}
