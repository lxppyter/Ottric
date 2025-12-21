import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create Channel', description: 'Create a new notification channel (Slack, Email, Webhook). Admin only.' })
  create(@Req() req, @Body() body: any) {
    return this.notificationsService.createChannel(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List Channels', description: 'List all active notification channels for the organization.' })
  findAll(@Req() req) {
    return this.notificationsService.getChannels(req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete Channel', description: 'Remove a notification channel. Admin only.' })
  remove(@Req() req, @Param('id') id: string) {
    return this.notificationsService.deleteChannel(req.user.id, id);
  }
}
