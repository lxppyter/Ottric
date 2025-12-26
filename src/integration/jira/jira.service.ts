import { Injectable, Logger } from '@nestjs/common';
import { TicketIntegration, CreateTicketDto } from '../ticket.interface';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IntegrationConfig, IntegrationType } from '../entities/integration-config.entity';

@Injectable()
export class JiraService implements TicketIntegration {
  private readonly logger = new Logger(JiraService.name);

  constructor(
      @InjectRepository(IntegrationConfig)
      private configRepository: Repository<IntegrationConfig>
  ) {}

  async getConfig(organizationId: string, type: IntegrationType) {
      const config = await this.configRepository.findOne({
          where: { organization: { id: organizationId }, type }
      });
      return config || { type, config: {}, isEnabled: false };
  }

  async saveConfig(organizationId: string, type: IntegrationType, data: any) {
      let config = await this.configRepository.findOne({
          where: { organization: { id: organizationId }, type }
      });

      if (!config) {
          config = this.configRepository.create({
              organization: { id: organizationId },
              type,
              config: data,
              isEnabled: true
          });
      } else {
          config.config = { ...config.config, ...data };
      }

      return this.configRepository.save(config);
  }

  async createTicket(dto: CreateTicketDto): Promise<string | null> {
    if (!dto.organizationId) {
        this.logger.warn('createTicket called without organizationId. Falling back to ENV or skipping.');
        if (!process.env.JIRA_HOST) return 'SKIPPED-NO-ORG-NO-ENV';
    }

    // 1. Try DB Config
    let dbConfig = {};
    let isEnabled = true;

    if (dto.organizationId) {
        const configEntity = await this.getConfig(dto.organizationId, IntegrationType.JIRA);
        // Fix: check if it's a real entity with ID
        if ('id' in configEntity) {
             isEnabled = configEntity.isEnabled;
             dbConfig = configEntity.config || {};
        }
    }

    if (!isEnabled) {
        this.logger.debug(`Jira integration disabled for org ${dto.organizationId}`);
        return 'SKIPPED-DISABLED';
    }

    // 2. Resolve Credentials (DB > Env)
    // Note: Config object keys must match what we saved in Frontend (host, email, token, projectKey)
    const host = (dbConfig as any).host || process.env.JIRA_HOST;
    const email = (dbConfig as any).email || process.env.JIRA_EMAIL;
    const token = (dbConfig as any).token || process.env.JIRA_TOKEN;
    const projectKey = (dbConfig as any).projectKey || process.env.JIRA_PROJECT_KEY || 'KAN';

    if (!host || !token || !email) {
        this.logger.warn(`Missing Jira configuration for org ${dto.organizationId} and no ENV fallback`);
        return 'SKIPPED-NO-CONFIG';
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    try {
      // Ensure host has protocol
      const baseUrl = host.startsWith('http') ? host : `https://${host}`;
      const url = `${baseUrl}/rest/api/2/issue`; // API v2 is stable, v3 is fine too but checking v2 first consistent with prev code.

      const payload = {
        fields: {
          project: {
            key: projectKey,
          },
          summary: dto.title,
          description: dto.description,
          issuetype: {
            name: 'Bug', // or Task, configurable?
          },
          priority: {
            name: this.mapPriority(dto.priority),
          },
          labels: dto.labels || ['ottric-security'],
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Created Jira ticket: ${response.data.key}`);
      return response.data.key;
    } catch (error) {
      this.logger.error(`Failed to create Jira ticket: ${error.message} params: ${host}, ${projectKey}`);
      if (error.response) {
          this.logger.error(`Jira Response: ${JSON.stringify(error.response.data)}`);
      }
      return null;
    }
  }

  async getTicketStatus(ticketId: string): Promise<string> {
      // TODO: Implement status check
      return 'To Do'; 
  }

  private mapPriority(p: string): string {
      // Map Ottric priority to Jira Priority names (Generic map)
      switch(p) {
          case 'Critical': return 'Highest';
          case 'High': return 'High';
          case 'Medium': return 'Medium';
          case 'Low': return 'Low';
          default: return 'Medium';
      }
  }
}
