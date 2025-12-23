import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get Profile',
    description: 'Get current user profile.',
  })
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.email);
    if (!user) {
      console.warn(
        `Profile requested for non-existent user: ${req.user.email}`,
      );
      // Perhaps throw NotFoundException
    }
    return user;
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get Notifications',
    description: 'Get personal notifications.',
  })
  async getNotifications(@Request() req) {
    return this.usersService.getPersonalNotifications(req.user.id);
  }

  @Post('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Mark Notification Read',
    description: 'Mark a notification as read.',
  })
  async markRead(@Request() req, @Param('id') id: string) {
    return this.usersService.markNotificationRead(id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update Profile',
    description: 'Update current user profile',
  })
  async updateProfile(@Request() req, @Body() body: any) {
    // In a real app we would use DTO
    // For MVP just allow updating "name" or similar if we added it.
    // Current User entity only has username, password.
    // I'll assume we might want to update password, or add "name" later.
    // For now, let's just return the user to confirm it works, or maybe
    // accept a "fullName" or "email" if we had those fields.

    // Let's verify we can find the user.
    const user = await this.usersService.findOne(req.user.email);
    // Mock update
    return { ...user, ...body, message: 'Profile updated (simulation)' };
  }

  @Post('waitlist')
  @ApiOperation({ summary: 'Join Waitlist' })
  async joinWaitlist(@Body() body: { email: string }) {
      if (!body.email) return { message: 'Email required' };
      return this.usersService.joinWaitlist(body.email);
  }
}
