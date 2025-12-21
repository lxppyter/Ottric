import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { PersonalNotification } from './personal-notification.entity';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column('simple-array', { default: 'user' })
  roles: string[]; // Keeping for backward compatibility if needed, or migration

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Organization, org => org.users, { nullable: true })
  organization: Organization | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER
  })
  role: UserRole;

  @OneToMany(() => PersonalNotification, notification => notification.user)
  notifications: PersonalNotification[];
}
