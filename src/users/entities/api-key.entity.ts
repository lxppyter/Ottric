import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity()
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  keyHash: string; // Bcrypt hash of the actual key

  @Column({ nullable: true })
  lastUsedAt: Date;

  @ManyToOne(() => Organization, (org) => org.apiKeys)
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;
}
