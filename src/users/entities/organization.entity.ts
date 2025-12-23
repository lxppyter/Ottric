import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import type { User } from './user.entity'; // Type only
import type { Product } from '../../products/entities/product.entity';
import type { Invitation } from './invitation.entity';
import type { ApiKey } from './api-key.entity';
import { NotificationChannel } from '../../notifications/entities/notification-channel.entity';

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
}

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  billingEmail: string;

  @OneToMany('User', (user: User) => user.organization) // Using string name for relation
  users: User[];

  @OneToMany('Product', (product: Product) => product.organization)
  products: Product[];

  @OneToMany('Invitation', (invitation: Invitation) => invitation.organization)
  invitations: Invitation[];

  @OneToMany('ApiKey', (apiKey: ApiKey) => apiKey.organization)
  apiKeys: ApiKey[];

  @OneToMany(
    'NotificationChannel',
    (channel: NotificationChannel) => channel.organization,
  )
  notificationChannels: NotificationChannel[];

  @CreateDateColumn()
  createdAt: Date;
}
