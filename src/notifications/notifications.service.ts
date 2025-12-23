import { Injectable, NotFoundException } from '@nestjs/common';
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

  async dispatch(userId: string, event: string, payload: any) {
    console.log(`[Dispatcher] Event: ${event} triggered for user ${userId}`);

    const channels = await this.getChannels(userId);
    const timestamp = new Date().toISOString();

    for (const channel of channels) {
      try {
        console.log(
          `[Dispatcher] Sending to channel: ${channel.name} (${channel.type})`,
        );

        const message = {
          text: `🚨 **Ottric Security Alert**\n*Event:* ${event}\n*Time:* ${timestamp}\n*Details:* ${JSON.stringify(payload, null, 2)}`,
          event,
          payload,
          timestamp,
        };

        if (channel.type === 'SLACK' || channel.type === 'WEBHOOK') {
          if (channel.config?.url) {
            await axios.post(channel.config.url, message);
            console.log(`[Dispatcher] Webhook sent to ${channel.config.url}`);
          }
        } else if (channel.type === 'EMAIL') {
          // Mock Email Sending
          console.log(
            `[Dispatcher] 📧 MOCK EMAIL sent to ${channel.config?.email}`,
          );
          console.log(`Subject: Security Alert - ${event}`);
          console.log(`Body:`, message.text);
        }
      } catch (error) {
        console.error(
          `[Dispatcher] Failed to send to channel ${channel.name}:`,
          error.message,
        );
      }
    }
  }
}
