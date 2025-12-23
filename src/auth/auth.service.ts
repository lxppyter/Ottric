import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  async forgotPassword(email: string): Promise<{ message: string }> {
    console.log(`[Mock] Password recovery requested for: ${email}`);
    // Real implementation would generate a token and send an email here
    return { message: 'If this email exists, a recovery code has been sent.' };
  }

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
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
      organizationName: user.organization?.name,
    };
    
    // Generate Refresh Token
    const refreshToken = await this.generateRefreshToken(user);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
    };
  }

  async generateRefreshToken(user: User | any): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const salt = await bcrypt.genSalt();
    const tokenHash = await bcrypt.hash(token, salt);

    const refreshToken = this.refreshTokenRepository.create({
      user: { id: user.id } as User, // user input might be just a partial object from validateUser
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const savedToken = await this.refreshTokenRepository.save(refreshToken);
    return `${savedToken.id}.${token}`;
  }

  async refresh(refreshTokenString: string) {
    const [id, token] = refreshTokenString.split('.');
    
    if (!id || !token) {
        throw new BadRequestException('Invalid refresh token format');
    }

    const refreshTokenEntity = await this.refreshTokenRepository.findOne({
      where: { id },
      relations: ['user', 'user.organization'], // Load relations needed for payload
    });

    if (!refreshTokenEntity) {
      throw new BadRequestException('Invalid refresh token');
    }

    if (refreshTokenEntity.isRevoked) {
      // Token Reuse Detection could be implemented here (revoke all user tokens)
      throw new BadRequestException('Token has been revoked');
    }

    if (refreshTokenEntity.expiresAt < new Date()) {
      throw new BadRequestException('Refresh token expired');
    }

    const isMatch = await bcrypt.compare(token, refreshTokenEntity.tokenHash);
    if (!isMatch) {
      throw new BadRequestException('Invalid refresh token');
    }

    // Reuse Detection / Rotation Policy: Revoke the used token
    refreshTokenEntity.isRevoked = true;
    await this.refreshTokenRepository.save(refreshTokenEntity);

    // Issue new tokens
    const user = refreshTokenEntity.user;
    const payload = {
        email: user.email,
        sub: user.id,
        roles: user.roles,
        role: user.role,
        organizationId: user.organization?.id,
        organizationName: user.organization?.name,
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(user);

    return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
    };
  }

  async revokeRefreshToken(refreshTokenString: string) {
      const [id] = refreshTokenString.split('.');
      if(!id) return;
      await this.refreshTokenRepository.update(id, { isRevoked: true });
  }

  async register(
    email: string,
    pass: string,
    orgName?: string,
    invitationToken?: string,
  ): Promise<User> {
    if (!orgName && !invitationToken) {
      throw new BadRequestException(
        'Either Organization Name or Invitation Token is required',
      );
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
  async registerViaInvite(
    email: string,
    pass: string,
    token: string,
  ): Promise<User> {
    const invitation = await this.usersService.validateInvitation(token);
    if (!invitation || invitation.status !== 'pending') {
      throw new BadRequestException('Invalid or expired invitation');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(pass, salt);

    // Create user in the organization from invitation
    const user = await this.usersService.create(
      email,
      hash,
      invitation.organization,
      invitation.role,
    );
    await this.usersService.acceptInvitation(invitation.id);

    return user;
  }
}
