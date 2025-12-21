import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Vulnerability } from '../../vuln/entities/vulnerability.entity';
import { Product } from '../../products/entities/product.entity';

export enum VexStatus {
  AFFECTED = 'affected',
  NOT_AFFECTED = 'not_affected',
  FIXED = 'fixed',
  UNDER_INVESTIGATION = 'under_investigation'
}

@Entity()
export class VexStatement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vulnerability, vuln => vuln.statements)
  vulnerability: Vulnerability;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ nullable: true })
  componentPurl: string; // The component this statement applies to

  @Column({
    type: 'enum',
    enum: VexStatus,
    default: VexStatus.UNDER_INVESTIGATION
  })
  status: VexStatus;

  @Column({ nullable: true })
  justification: string;

  @Column({ nullable: true })
  impactEvaluation: string;
}
