import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      roles: user.roles,
      role: user.role, // Add single role info
      organizationId: user.organization?.id,
      organizationName: user.organization?.name 
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(email: string, pass: string, orgName?: string, invitationToken?: string): Promise<User> {
    if (!orgName && !invitationToken) {
        throw new BadRequestException('Either Organization Name or Invitation Token is required');
    }

    let org;
    let invitation;

    if (invitationToken) {
        // Validate Invitation
        invitation = await this.usersService.validateInvitation(invitationToken);
        if (!invitation || invitation.status !== 'pending') {
            throw new BadRequestException('Invalid or expired invitation');
        }
        org = invitation.organization;
    } else {
        // Create New Org
        console.log('Registering user, creating org:', orgName);
        org = await this.usersService.createOrganization(orgName!);
    }
    
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(pass, salt);

    // Create User linked to Org
    const role = invitation ? invitation.role : UserRole.ADMIN;
    const user = await this.usersService.create(email, hash, org, role);

    if (invitation) {
        await this.usersService.acceptInvitation(invitation.id);
    }
    
    return user;
  }
  async registerViaInvite(email: string, pass: string, token: string): Promise<User> {
    const invitation = await this.usersService.validateInvitation(token);
    if (!invitation || invitation.status !== 'pending') {
        throw new BadRequestException('Invalid or expired invitation');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(pass, salt);

    // Create user in the organization from invitation
    const user = await this.usersService.create(email, hash, invitation.organization, invitation.role);
    await this.usersService.acceptInvitation(invitation.id);
    
    return user;
  }
}
