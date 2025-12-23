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

  @ManyToOne(() => User, { eager: true }) // Load owner automatically for checks
  owner: User;

  @ManyToOne(() => Organization, (org) => org.products)
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Release, (release) => release.product, { cascade: true })
  releases: Release[];
}
