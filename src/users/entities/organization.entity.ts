import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import type { User } from './user.entity'; // Type only
import type { Product } from '../../products/entities/product.entity';
import type { Invitation } from './invitation.entity';
import type { ApiKey } from './api-key.entity';
import { NotificationChannel } from '../../notifications/entities/notification-channel.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany('User', (user: User) => user.organization) // Using string name for relation
  users: User[];

  @OneToMany('Product', (product: Product) => product.organization)
  products: Product[];

  @OneToMany('Invitation', (invitation: Invitation) => invitation.organization)
  invitations: Invitation[];

  @OneToMany('ApiKey', (apiKey: ApiKey) => apiKey.organization)
  apiKeys: ApiKey[];

  @OneToMany('NotificationChannel', (channel: NotificationChannel) => channel.organization)
  notificationChannels: NotificationChannel[];

  @CreateDateColumn()
  createdAt: Date;
}
