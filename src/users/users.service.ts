import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserRole } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { ApiKey } from './entities/api-key.entity';
import { PersonalNotification } from './entities/personal-notification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>, // Renamed from orgRepository
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(PersonalNotification)
    private personalNotificationRepository: Repository<PersonalNotification>,
  ) {
      console.log('UsersService initialized');
  }

  async findOne(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
        where: { email: email.toLowerCase() },
        relations: ['organization']
    });
  }

  // Personal Notifications
  async createPersonalNotification(userId: string, title: string, message: string, type: string = 'INFO') {
      const user = await this.usersRepository.findOneBy({ id: userId });
      if (!user) return;

      const notif = this.personalNotificationRepository.create({
          user,
          title,
          message,
          type: type as any
      });
      return this.personalNotificationRepository.save(notif);
  }

  async getPersonalNotifications(userId: string) {
      return this.personalNotificationRepository.find({
          where: { user: { id: userId } },
          order: { createdAt: 'DESC' },
          take: 20
      });
  }

  async markNotificationRead(notifId: string) {
      return this.personalNotificationRepository.update(notifId, { isRead: true });
  }

  async create(email: string, passwordHash: string, organization: Organization, role: UserRole = UserRole.MEMBER): Promise<User> {
    const user = this.usersRepository.create({
      email: email.toLowerCase(),
      password: passwordHash,
      organization,
      role,
      roles: ['user'], // Keeping legacy roles for now
    });
    return this.usersRepository.save(user);
  }

  async getOrganization(userId: string) {
      const user = await this.usersRepository.findOne({ 
          where: { id: userId }, 
          relations: ['organization', 'organization.users'] 
      });
      if (!user) throw new Error('User not found');
      return user.organization;
  }

  async updateOrganization(userId: string, name: string) {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['organization'] });
      if (!user) throw new Error('User not found');
      if (user.role !== 'admin') throw new Error('Only admins can update organization');
      
      const org = user.organization;
      if (!org) throw new Error('User has no organization');
      
      org.name = name;
      return this.organizationRepository.save(org);
  }

  async createInvitation(userId: string, email?: string, role: string = 'member') {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['organization'] });
      if (!user) throw new Error('User not found');
      if (user.role !== 'admin') throw new Error('Only admins can invite members');
      if (!user.organization) throw new Error('User has no organization');

      // 15 minutes expiration
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const invitation = this.invitationRepository.create({
          email: email || undefined,
          organization: user.organization!,
          expiresAt,
          role: role as any // Casting to any/UserRole
      });
      return this.invitationRepository.save(invitation);
  }

  async validateInvitation(token: string): Promise<Invitation | null> {
      const invitation = await this.invitationRepository.findOne({ 
          where: { id: token },
          relations: ['organization']
      });

      if (!invitation) return null;

      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
          invitation.status = InvitationStatus.EXPIRED;
          await this.invitationRepository.save(invitation);
          return invitation; 
      }

      return invitation;
  }

  async deleteInvitation(userId: string, invitationId: string) {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['organization'] });
      if (!user || user.role !== 'admin') throw new Error('Unauthorized');
      
      const invitation = await this.invitationRepository.findOne({ 
          where: { id: invitationId },
          relations: ['organization']
      });

      if (!invitation) throw new Error('Invitation not found');
      if (invitation.organization.id !== user.organization!.id) throw new Error('Unauthorized access to invitation');

      return this.invitationRepository.remove(invitation);
  }

  async createApiKey(userId: string, name: string) {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['organization'] });
      if (!user || user.role !== 'admin') throw new Error('Unauthorized');

      // Generate actual key
      const keyId = crypto.randomUUID();
      const secret = crypto.randomBytes(32).toString('hex');
      const apiKeyString = `sk_${keyId}.${secret}`;

      // Hash the full key string (or just the secret? Strategy says full key matches hash)
      // Strategy uses: bcrypt.compare(apiKey, keyEntity.keyHash)
      // So we hash the FULL `sk_uuid.secret` string.
      const salt = await bcrypt.genSalt();
      const keyHash = await bcrypt.hash(apiKeyString, salt);

      const apiKey = this.apiKeyRepository.create({
          id: keyId, // Store UUID part as ID for faster lookup if we wanted, but we store full text match for now?
          // Wait, in Strategy I changed logic to lookup by ID.
          // Strategy: `const keyId = apiKey.split('.')[0].replace('sk_', '');`
          // So we MUST store `keyId` (the uuid) as the primary key `id`.
          name,
          keyHash,
          organization: user.organization!
      });
      
      await this.apiKeyRepository.save(apiKey);

      // Return the raw key ONLY ONCE
      return { ...apiKey, key: apiKeyString };
  }

  async getOrganizationApiKeys(userId: string) {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['organization'] });
      if (!user) throw new Error('User not found');

      if (!user.organization) return [];

      return this.apiKeyRepository.find({
          where: { organization: { id: user.organization.id } },
          order: { createdAt: 'DESC' }
      });
  }

  async deleteApiKey(userId: string, keyId: string) {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['organization'] });
      if (!user || user.role !== 'admin') throw new Error('Unauthorized');

      const key = await this.apiKeyRepository.findOne({ 
          where: { id: keyId },
          relations: ['organization']
      });

      if (!key) throw new Error('Key not found');
      if (!user.organization || key.organization.id !== user.organization.id) throw new Error('Unauthorized');

      return this.apiKeyRepository.remove(key);
  }

  async createOrganization(name: string): Promise<Organization> {
    console.log('Creating organization:', name);
    try {
        const org = this.organizationRepository.create({ name });
        return await this.organizationRepository.save(org);
    } catch (e) {
        console.error('Error creating org:', e);
        throw e;
    }
  }


  async getOrganizationInvitations(userId: string) {
      const user = await this.usersRepository.findOne({ where: { id: userId }, relations: ['organization'] });
      if (!user || !user.organization) throw new Error('User/Org not found');
      
      return this.invitationRepository.find({
          where: { organization: { id: user.organization.id } },
          order: { createdAt: 'DESC' }
      });
  }

  async acceptInvitation(invitationId: string) {
      const invitation = await this.invitationRepository.findOneBy({ id: invitationId });
      if (invitation) {
          invitation.status = InvitationStatus.ACCEPTED;
          await this.invitationRepository.save(invitation);
      }
  }


  async removeMember(adminId: string, memberId: string) {
      const admin = await this.usersRepository.findOne({ where: { id: adminId }, relations: ['organization'] });
      const member = await this.usersRepository.findOne({ where: { id: memberId }, relations: ['organization'] });

      if (!admin || !member) throw new Error('User not found');
      
      if (admin.organization?.id !== member.organization?.id) {
          throw new Error('Member belongs to a different organization');
      }

      if (admin.id === member.id) {
          throw new Error('Cannot remove yourself');
      }

      // Unlink from organization instead of delete
      member.organization = null;
      // Reset role to default or keep? If they have no org, role is ambiguous.
      // Let's reset to MEMBER default, but effective permissions are null without org.
      member.role = UserRole.MEMBER; 
      
      await this.createPersonalNotification(
          member.id, 
          'Security Alert: Organization Removal', 
          `You have been removed from the organization ${admin.organization?.name} by an Administrator. If you believe this is an error, please contact support.`,
          'SYSTEM_ALERT'
      );

      return this.usersRepository.save(member);
  }

  async updateUser(user: User) {
      return this.usersRepository.save(user);
  }

  async updateOrganizationName(orgId: string, name: string) {
      return this.organizationRepository.update(orgId, { name });
  }

  async listInvites(orgId: string) {
    return this.invitationRepository.find({
        where: { organization: { id: orgId }, status: InvitationStatus.PENDING }
    }); 
  }
}
