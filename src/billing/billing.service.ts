import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Organization,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../users/entities/organization.entity';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
  ) {}

  async getCurrentSubscription(orgId: string) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    return {
      plan: org.subscriptionPlan,
      status: org.subscriptionStatus,
      billingEmail: org.billingEmail,
      features: this.getFeaturesForPlan(org.subscriptionPlan),
    };
  }

  async upgradeSubscription(orgId: string, plan: SubscriptionPlan) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    org.subscriptionPlan = plan;
    org.subscriptionStatus = SubscriptionStatus.ACTIVE;

    // Mock Stripe ID if not exists
    if (!org.stripeCustomerId) {
      org.stripeCustomerId = 'cus_' + Math.random().toString(36).substring(7);
    }

    return this.orgRepo.save(org);
  }

  async getInvoiceHistory(orgId: string) {
    // Mock Data
    return [
      {
        id: 'inv_1',
        date: new Date(),
        amount: 0,
        status: 'PAID',
        plan: 'Free Tier',
      },
      // Add more if PRO
    ];
  }

  private getFeaturesForPlan(plan: SubscriptionPlan) {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return { maxProjects: 1, retentionDays: 7, support: 'Community' };
      case SubscriptionPlan.PRO:
        return { maxProjects: 50, retentionDays: 90, support: 'Email' };
      case SubscriptionPlan.ENTERPRISE:
        return { maxProjects: 9999, retentionDays: 365, support: 'Dedicated' };
    }
  }
}
