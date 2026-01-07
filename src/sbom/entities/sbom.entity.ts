import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Release } from '../../products/entities/release.entity';
import { Component } from './component.entity';

@Entity()
export class Sbom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Release, (release) => release.sbom)
  release: Release;

  @Column({ type: 'jsonb' })
  content: any; // Raw JSON content

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Component, (component) => component.sbom)
  components: Component[];
}
