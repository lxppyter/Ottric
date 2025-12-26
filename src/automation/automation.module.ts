import { Module, forwardRef } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { IntegrationModule } from '../integration/integration.module';
import { VexModule } from '../vex/vex.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
      IntegrationModule, 
      forwardRef(() => VexModule),
      NotificationsModule
  ],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
