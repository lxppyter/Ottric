import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationChannel,
  NotificationType,
} from './entities/notification-channel.entity';
import { UsersService } from '../users/users.service';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationChannel)
    private channelRepository: Repository<NotificationChannel>,
    private usersService: UsersService,
  ) {}

  async createChannel(
    userId: string,
    data: {
      name: string;
      type: NotificationType;
      config: any;
      triggers: string[];
    },
  ) {
    const org = await this.usersService.getOrganization(userId);
    if (!org) throw new NotFoundException('Organization not found');

    const channel = this.channelRepository.create({
      ...data,
      organization: org,
    });
    return this.channelRepository.save(channel);
  }

  async getChannels(userId: string) {
    const org = await this.usersService.getOrganization(userId);
    if (!org) return [];

    return this.channelRepository.find({
      where: { organization: { id: org.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteChannel(userId: string, channelId: string) {
    const org = await this.usersService.getOrganization(userId);
    if (!org) throw new NotFoundException('Organization not found');

    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['organization'],
    });

    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.organization.id !== org.id)
      throw new NotFoundException('Channel not found'); // Security check

    return this.channelRepository.remove(channel);
  }

  private readonly logger = new Logger(NotificationsService.name);

  // ... (existing methods createChannel, getChannels, deleteChannel) ...

  async sendAlert(orgId: string, event: 'criticalVuln' | 'ingestion' | string, payload: any) {
      // 1. System Channels
      await this.dispatchToChannels(orgId, event, payload);
      
      // 2. Personal Notifications
      await this.notifyUsers(orgId, event, payload);
  }

  private async dispatchToChannels(orgId: string, event: string, payload: any) {
      const channels = await this.channelRepository.find({
          where: { organization: { id: orgId } }
      });
      
      const timestamp = new Date().toISOString();
      const messageText = `🚨 **Ottric Security Alert**\n*Event:* ${event}\n*Time:* ${timestamp}\n*Details:* ${JSON.stringify(payload, null, 2)}`;

      for (const channel of channels) {
          try {
              if (channel.type === 'WEBHOOK' && channel.config?.url) {
                  await axios.post(channel.config.url, {
                      text: messageText,
                      event,
                      payload
                  });
              }
              // Legacy Email Channels (if any exist)
              if (channel.type === 'EMAIL' && channel.config?.email) {
                  this.logger.log(`[System Email] Sending to ${channel.config.email}`);
              }
          } catch (e) {
              this.logger.error(`Failed to dispatch to channel ${channel.name}: ${e.message}`);
          }
      }
  }

  private async notifyUsers(orgId: string, event: string, payload: any) {
      const users = await this.usersService.getUsersByOrg(orgId);
      for (const user of users) {
          const prefs: any = user.notificationPreferences || { email: true, criticalVuln: true, ingestion: true };
          
          // 1. Master Switch
          if (prefs.email === false) continue;

          // 2. Specific Event toggle
          // If preference key exists and is false, skip.
          // Supported Keys: 'criticalVuln', 'ingestion'
          if (prefs[event] === false) continue;

          this.logger.log(`[Personal Email] Sending ${event} alert to ${user.email}`);
          // Integration with SendGrid/SMTP would go here
      }
  }

  // Deprecated/Legacy Adapter
  async dispatch(userId: string, event: string, payload: any) {
     const org = await this.usersService.getOrganization(userId);
     if (org) {
         await this.sendAlert(org.id, event, payload);
     }
  }
}
