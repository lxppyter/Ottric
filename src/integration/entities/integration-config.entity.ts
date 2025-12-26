import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique
} from 'typeorm';
import { Organization } from '../../users/entities/organization.entity';

export enum IntegrationType {
  JIRA = 'JIRA',
  GITHUB = 'GITHUB',
  SLACK = 'SLACK'
}

@Entity()
@Unique(['organization', 'type']) // One config per type per org
export class IntegrationConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  organization: Organization;

  @Column({
    type: 'enum',
    enum: IntegrationType,
  })
  type: IntegrationType;

  @Column('jsonb', { default: {} })
  config: any; // Stores host, email, token, projectKey, etc.

  @Column({ default: true })
  isEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
