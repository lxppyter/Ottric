import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum ResourceType {
  VEX = 'VEX',
  PROJECT = 'PROJECT',
  USER = 'USER',
}

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string; // Storing ID directly to minimize relations overhead for logs, or could be relation if strict referential integrity needed. String is safer for audit retention even if user deleted.

  @Column({ nullable: true })
  userName: string; // Snapshot of username at time of action

  @Column({
    type: 'enum',
    enum: ResourceType,
  })
  resourceType: ResourceType;

  @Column()
  resourceId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column('jsonb', { nullable: true })
  changes: any; // e.g. { field: { old: 'val', new: 'val' } }

  @Column({ nullable: true })
  details: string; // Human readable summary or justification

  @CreateDateColumn()
  timestamp: Date;
}
