import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from '../../users/entities/organization.entity';

export enum NotificationType {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  WEBHOOK = 'WEBHOOK',
}

@Entity()
export class NotificationChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column('jsonb')
  config: Record<string, any>; // Stores webhookUrl, email, etc.

  @Column('simple-array', { nullable: true })
  triggers: string[]; // e.g., ['vuln_critical', 'ingest_failed']

  @ManyToOne(() => Organization, (org) => org.notificationChannels, { onDelete: 'CASCADE' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
