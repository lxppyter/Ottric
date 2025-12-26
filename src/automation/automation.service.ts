import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { JiraService } from '../integration/jira/jira.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VexService } from '../vex/vex.service';
import { VexStatement } from '../vex/entities/vex-statement.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private jiraService: JiraService,
    @Inject(forwardRef(() => VexService))
    private vexService: VexService,
    private notificationsService: NotificationsService,
  ) {}

  async runRules(product: Product, version: string, statements: VexStatement[]) {
    this.logger.log(`Running automation rules for product: ${product.name}, version: ${version}, items: ${statements.length}`);

    for (const stmt of statements) {
      if (!stmt.vulnerability) continue;
      
      const sev = stmt.vulnerability.severity;
      // RULE 1: Auto-Ticket for Critical/High Severity
      if (sev === 'CRITICAL' || sev === 'HIGH') {
         await this.handleCriticalVuln(product, version, stmt);
      }
    }
  }

  private async handleCriticalVuln(product: Product, version: string, stmt: VexStatement) {
    if (stmt.justification && stmt.justification.includes('Jira Ticket:')) {
        return; // Already has ticket
    }

    const ticketKey = await this.jiraService.createTicket({
        title: `[SECURITY] ${stmt.vulnerability.severity} Vulnerability ${stmt.vulnerability.id} in ${product.name}`,
        description: `
          Product: ${product.name}
          Version: ${version}
          Vulnerability: ${stmt.vulnerability.id}
          Severity: ${stmt.vulnerability.severity}
          Component: ${stmt.componentPurl}
          
          Link: http://localhost:3000/dashboard/projects/${encodeURIComponent(product.name)}/vulnerabilities
        `,
        priority: stmt.vulnerability.severity === 'CRITICAL' ? 'Critical' : 'High',
        organizationId: product.organization?.id
    });

    if (ticketKey && ticketKey !== 'SKIPPED-NO-CONFIG') {
        this.logger.log(`Created ticket ${ticketKey} for ${stmt.vulnerability.id}`);
        
        // Update VEX with Ticket ID
        // Warning: This calls VexService.update, which might loop if we are not careful.
        // But runRules is called AFTER create/correlate. 
        // We'll use a direct update or careful call.
        // Using vexService.updateStatus requires userId. We can direct update entity here to avoid complexity or loop.
        // But accessing repository requires Module export. 
        // Let's call a specific method in VexService 'appendJustification' ?
        // Or just assume VexService.updateStatus is fine if we pass 'SYSTEM' user.
        
        // Actually, let's keep it simple. Just VexService.updateStatus with a system usage flag?
        // No, I'll direct update via VexService helper to avoid full auth check logic if possible.
        // But simpler: just append to justification string in memory if this is called INSIDE correlate loop?
        // No, runRules is called AFTER correlate loop finishes.
        
        // I will add a method to VexService: addTicketRef(vexId, ticketKey)
        await this.vexService.addTicketRef(stmt.id, ticketKey);
    }

    // Trigger Notification (Email/Webhook)
    if (product.organization?.id) {
        await this.notificationsService.sendAlert(
            product.organization.id, 
            'criticalVuln', 
            {
                severity: stmt.vulnerability.severity,
                vulnId: stmt.vulnerability.id,
                product: product.name,
                ticket: ticketKey || 'None',
                link: `http://localhost:3000/dashboard/projects/${encodeURIComponent(product.name)}/vulnerabilities`
            }
        );
    }
  }
}
