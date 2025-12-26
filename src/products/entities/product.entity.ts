import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Release } from './release.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../users/entities/organization.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  })
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @Column({
    type: 'enum',
    enum: ['DEVELOPMENT', 'STAGING', 'PRODUCTION'],
    default: 'DEVELOPMENT',
  })
  environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

  @Column({ default: false })
  isInternetFacing: boolean;

  @Column({ type: 'int', default: 100 })
  complianceScore: number;

  @Column({ type: 'varchar', default: 'A' })
  complianceGrade: string; // 'A', 'B', 'C', 'D', 'F'

  // --- Integrations ---
  @Column({ nullable: true })
  repositoryUrl: string;

  @Column({ nullable: true })
  manifestFilePath: string; // e.g. "backend/package.json"

  @Column({ type: 'text', nullable: true, select: false })
  githubToken: string; // Encrypted

  @Column({ nullable: true, select: false })
  githubTokenIv: string; // Initialization Vector
  // --------------------

  @ManyToOne(() => User, { eager: true }) // Load owner automatically for checks
  owner: User;

  @ManyToOne(() => Organization, (org) => org.products)
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Release, (release) => release.product, { cascade: true })
  releases: Release[];
}
