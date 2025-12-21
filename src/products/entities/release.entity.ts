import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { Sbom } from '../../sbom/entities/sbom.entity';

@Entity()
export class Release {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  version: string;

  @Column({ type: 'text', nullable: true })
  commitSha: string | null;

  @Column({ type: 'text', nullable: true })
  buildId: string | null;

  @Column({ type: 'text', nullable: true })
  imageDigest: string | null;

  @Column({ type: 'text', nullable: true })
  platform: string | null;

  @ManyToOne(() => Product, product => product.releases)
  product: Product;

  @OneToOne(() => Sbom, sbom => sbom.release)
  @JoinColumn()
  sbom: Sbom;

  @CreateDateColumn()
  createdAt: Date;
}
