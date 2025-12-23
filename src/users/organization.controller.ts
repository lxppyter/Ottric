import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Body,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Organization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create Organization',
    description: 'Create a new organization and return refreshed token.',
  })
  async createOrganization(@Req() req, @Body('name') name: string) {
    if (!name) throw new Error('Organization name is required');

    const user = await this.usersService.findOne(req.user.email);
    if (!user) throw new Error('User not found');
    if (user.organization) throw new Error('User already in an organization');

    const org = await this.usersService.createOrganization(name);

    // Link user to new org and make Admin
    user.organization = org;
    user.role = UserRole.ADMIN;
    await this.usersService.updateUser(user);

    // Generate New Token
    const payload = {
      email: user.email,
      sub: user.id,
      // roles: user.roles, // Legacy support if needed, but we rely on role now
      role: user.role,
      organizationId: org.id,
      organizationName: org.name,
    };

    return {
      organization: org,
      access_token: this.jwtService.sign(payload),
    };
  }

  @Post('invites')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generate Invitation Key',
    description:
      'Generate a new generic invitation key (valid for 15 mins). Admin only.',
  })
  async generateInvite(@Req() req, @Body('role') role?: UserRole) {
    return this.usersService.createInvitation(req.user.id, undefined, role); // Assuming we update createInvitation
  }

  @Post('api-keys')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generate API Key',
    description: 'Generate a new API key for CI/CD integration. Admin only.',
  })
  async generateApiKey(@Req() req) {
    // Create a key in service
    return this.usersService.createApiKey(req.user.id, 'Generated Key');
  }

  @Get('api-keys')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List API Keys',
    description: 'List active API keys. Admin only.',
  })
  async listApiKeys(@Req() req) {
    return this.usersService.getOrganizationApiKeys(req.user.id);
  }

  @Get('invites')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List Invites',
    description: 'List pending invites. Admin only.',
  })
  listInvites(@Req() req) {
    if (!req.user.organizationId) {
      throw new UnauthorizedException('User not in organization');
    }
    return this.usersService.listInvites(req.user.organizationId);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update Organization',
    description: 'Update organization details. Admin only.',
  })
  updateOrganization(@Req() req, @Body() body: { name: string }) {
    if (!req.user.organizationId) {
      throw new UnauthorizedException('User not in organization');
    }
    return this.usersService.updateOrganizationName(
      req.user.organizationId,
      body.name,
    );
  }

  @Delete('api-keys/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete API Key',
    description: 'Revoke an API key. Admin only.',
  })
  async deleteApiKey(@Req() req, @Param('id') id: string) {
    return this.usersService.deleteApiKey(req.user.id, id);
  }

  @Delete('invites/:id')
  @ApiOperation({
    summary: 'Delete Invitation',
    description: 'Delete an invitation key.',
  })
  async deleteInvite(@Req() req, @Param('id') id: string) {
    console.log(`Deleting invite ${id} for user ${req.user.id}`);
    try {
      return await this.usersService.deleteInvitation(req.user.id, id);
    } catch (e) {
      console.error('Delete Invite Error:', e);
      throw e; // NestJS will handle the error response usually, but maybe we need HttpException
    }
  }

  @Delete('members/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Remove Member',
    description: 'Remove a user from the organization. Admin only.',
  })
  async removeMember(@Req() req, @Param('id') id: string) {
    try {
      await this.usersService.removeMember(req.user.id, id);
      return { message: 'Member removed successfully' };
    } catch (e) {
      // Ideally use HttpException
      throw new Error(e.message);
    }
  }

  @Get('members')
  @ApiOperation({
    summary: 'List Members',
    description: 'List members of the organization.',
  })
  async listMembers(@Req() req) {
    const org = await this.usersService.getOrganization(req.user.id);
    if (!org || !org.users) return [];

    return org.users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));
  }
}
