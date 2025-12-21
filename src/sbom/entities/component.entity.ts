import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Sbom } from './sbom.entity';

@Entity()
export class Component {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  version: string;

  @Column({ nullable: true })
  @Index()
  purl: string; // Package URL

  @Column({ nullable: true })
  cpe: string;

  @Column({ nullable: true })
  supplier: string;

  @Column('simple-array', { nullable: true })
  licenses: string[];

  @Column('jsonb', { nullable: true })
  hashes: any;

  @ManyToOne(() => Sbom, sbom => sbom.components)
  sbom: Sbom;
}
