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



  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update Profile',
    description: 'Update current user profile (preferences, etc.)',
  })
  async updateProfile(@Request() req, @Body() body: any) {
    // Whitelist allowed fields for update
    const updateData: any = {};
    if (body.notificationPreferences) {
        updateData.notificationPreferences = body.notificationPreferences;
    }
    // Add other fields here as needed (e.g. name, avatar)

    if (Object.keys(updateData).length > 0) {
        return this.usersService.updateProfile(req.user.id, updateData);
    }
    
    return this.usersService.findOne(req.user.email);
  }

  @Post('waitlist')
  @ApiOperation({ summary: 'Join Waitlist' })
  async joinWaitlist(@Body() body: { email: string }) {
      if (!body.email) return { message: 'Email required' };
      return this.usersService.joinWaitlist(body.email);
  }
}
