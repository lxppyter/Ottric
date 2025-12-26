import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntegrationConfig } from './entities/integration-config.entity';
import { JiraService } from './jira/jira.service';
import { IntegrationController } from './integration.controller';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [
      TypeOrmModule.forFeature([IntegrationConfig]),
      forwardRef(() => AutomationModule) 
  ],
  controllers: [IntegrationController],
  providers: [
      {
          provide: 'TicketIntegration',
          useClass: JiraService
      },
      JiraService 
  ],
  exports: ['TicketIntegration', JiraService, TypeOrmModule],
})
export class IntegrationModule {}
