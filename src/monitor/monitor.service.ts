import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductsService } from '../products/products.service';
import { SbomService } from '../sbom/sbom.service';
import { VulnService } from '../vuln/vuln.service';
import { VexService } from '../vex/vex.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VexStatus } from '../vex/entities/vex-statement.entity';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  constructor(
    private productsService: ProductsService,
    private sbomService: SbomService,
    private vulnService: VulnService,
    private vexService: VexService,
    private notificationsService: NotificationsService,
  ) {}

  // Run every day at 3:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyScan() {
    this.logger.log('Starting daily vulnerability scan...');

    // 1. Get all products
    // Note: optimization needed for thousands of products.
    // Ideally we stream or paginate this. For MVP fetch all.
    const products = await this.productsService.findAll();

    for (const product of products) {
      try {
        this.logger.debug(`Scanning product: ${product.name}`);

        // 2. Get latest release for this product
        const latestRelease = await this.productsService.findLatestRelease(
          product.id,
        );
        if (!latestRelease) continue;

        // 3. Get SBOM for latest release
        const sbom = await this.sbomService.findByReleaseId(latestRelease.id);
        if (!sbom || !sbom.content || !sbom.content.components) continue;

        // 4. Enrich/Rescan with OSV
        const components = sbom.content.components;
        // This method queries OSV.dev
        const vulnerabilitiesMap =
          await this.vulnService.enrichWithOsv(components);

        let newVulnCount = 0;

        // 5. Check for NEW vulnerabilities
        for (const comp of components) {
          if (!comp.purl) continue;
          const vulns = vulnerabilitiesMap[comp.purl];
          if (!vulns || vulns.length === 0) continue;

          for (const vuln of vulns) {
            // Check if VEX statement exists
            const statement = await this.vexService.findByProductVuln(
              product.id,
              vuln.id,
              comp.purl,
            );

            if (!statement) {
              // NEW VULNERABILITY DETECTED!
              await this.vexService.createAuto({
                product,
                vulnerability: vuln,
                componentPurl: comp.purl,
                status: VexStatus.UNDER_INVESTIGATION,
                justification: 'Detected during nightly scan',
              });
              newVulnCount++;
            }
          }
        }

        if (newVulnCount > 0) {
          this.logger.warn(
            `Detected ${newVulnCount} new vulnerabilities for ${product.name}`,
          );

          // 6. Notify Organization Members
          // We need a helper to find users of this org.
          // Assuming we can send to organization ID directly effectively
          const members = await this.productsService.getOrganizationMembers(
            product.organization.id,
          );
          for (const member of members) {
            await this.notificationsService.dispatch(member.id, 'scan.alert', {
              product: product.name,
              version: latestRelease.version,
              count: newVulnCount,
            });
          }
        }
      } catch (e) {
        this.logger.error(`Failed to scan product ${product.id}`, e);
      }
    }

    this.logger.log('Daily scan completed.');
  }
}
