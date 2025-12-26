import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { VexStatement, VexStatus } from './entities/vex-statement.entity';
import { Sbom } from '../sbom/entities/sbom.entity';
import { VulnService } from '../vuln/vuln.service';
import { UpdateVexStatusDto } from './dto/update-vex-status.dto';
import { CreateVexDto } from './dto/create-vex.dto';
import { BulkUpdateVexDto } from './dto/bulk-update-vex.dto';
import { Product } from '../products/entities/product.entity';
import { Vulnerability } from '../vuln/entities/vulnerability.entity';
import { User } from '../users/entities/user.entity';

import { PurlUtils } from '../common/utils/purl.utils';

import { AnalysisService } from '../analysis/analysis.service';
import { ReachabilityStatus } from './entities/vex-statement.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ResourceType } from '../audit/entities/audit-log.entity';
import { AutomationService } from '../automation/automation.service';
import { Inject, forwardRef } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { PolicyService } from '../policies/policy.service';

@Injectable()
export class VexService {
  constructor(
    @InjectRepository(VexStatement)
    private vexRepository: Repository<VexStatement>,
    private vulnService: VulnService,
    private entityManager: EntityManager,
    private analysisService: AnalysisService,
    private auditService: AuditService,
    @Inject(forwardRef(() => AutomationService))
    private automationService: AutomationService,
    private productsService: ProductsService,
    private policyService: PolicyService,
  ) {}

  async create(dto: CreateVexDto, userId: string) {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      relations: ['organization'],
    });
    if (!user || !user.organization)
      throw new Error('User has no organization');

    let product = await this.entityManager.findOne(Product, {
      where: {
        name: dto.productName,
        organization: { id: user.organization.id },
      },
    });

    if (!product) {
      product = this.entityManager.create(Product, {
        name: dto.productName,
        version: '1.0.0',
        organization: user.organization,
      });
      await this.entityManager.save(product);
    }

    let vuln = await this.entityManager.findOne(Vulnerability, {
      where: { id: dto.vulnerabilityId },
    });
    if (!vuln) {
      vuln = this.entityManager.create(Vulnerability, {
        id: dto.vulnerabilityId,
        severity: 'Unknown',
        description: 'Manually created via VEX Manager',
        affectedPackages: [],
      });
      await this.entityManager.save(vuln);
    }

    const purl = PurlUtils.generate('generic', null, dto.productName, '1.0.0', null, null);

    const statement = this.vexRepository.create({
      product: product,
      vulnerability: vuln,
      status: dto.status,
      justification: dto.justification,
      componentPurl: purl,
    });

    return this.vexRepository.save(statement);
  }

  async correlate(sbom: Sbom) {
    const components = sbom.content?.components || [];
    if (components.length === 0) return;

    const vulnerabilitiesMap = await this.vulnService.enrichWithOsv(components);
    const processedStatements: VexStatement[] = [];

    for (const comp of components) {
      if (!comp.purl) continue;
      const vulns = vulnerabilitiesMap[comp.purl];
      if (!vulns || vulns.length === 0) continue;

      for (const vuln of vulns) {
        const product = sbom.release.product;

        let statement = await this.vexRepository.findOne({
          where: {
            product: { id: product.id },
            vulnerability: { id: vuln.id },
            componentPurl: comp.purl,
          },
          relations: ['vulnerability', 'product']
        });

        if (!statement) {
          statement = this.vexRepository.create({
            product: product,
            vulnerability: vuln,
            componentPurl: comp.purl,
            status: VexStatus.UNDER_INVESTIGATION,
            justification: 'Automatically correlated via OSV',
          });
          statement = await this.vexRepository.save(statement);
        }
        processedStatements.push(statement);
      }
    }

    // Trigger Automation
    if (processedStatements.length > 0) {
        // Run async without awaiting to not block ingestion? 
        // Or await to ensure tickets created before user sees dashboard?
        // Safer to await for now.
        await this.automationService.runRules(sbom.release.product, sbom.release.version, processedStatements);
    }
  }

  /**
   * Run reachability analysis and suggest VEX statuses.
   * NOTE: This assumes projectPath is locally accessible.
   */


  /**
   * Run reachability analysis and suggest VEX statuses.
   * NOTE: This assumes projectPath is locally accessible.
   */
  async suggestReachability(sbom: Sbom, projectPath: string) {
      if (!projectPath) return;
      
      const importedMap = await this.analysisService.analyzeReachability(projectPath, sbom);
      
      // components in SBOM
      const components = sbom.content?.components || [];

      for (const comp of components) {
          if (!comp.purl || !comp.name) continue; // We need name for now as map is keyed by name
          
          const evidence = importedMap.get(comp.name); // returns string[] or undefined
          const isReachable = !!evidence;
          
          // Determine status
          let reachStatus = ReachabilityStatus.NO_EVIDENCE;
          if (isReachable) {
              if (evidence!.includes('Transitive Dependency')) {
                  reachStatus = ReachabilityStatus.TRANSITIVE;
              } else {
                  reachStatus = ReachabilityStatus.DIRECT;
              }
          }

          // Find VEX statements (create if not exists logic is usually in correlate, here we update)
          const vexStatements = await this.vexRepository.find({
              where: {
                  product: { id: sbom.release.product.id },
                  componentPurl: comp.purl,
              },
              relations: ['product', 'vulnerability']
          });

          for (const stmt of vexStatements) {
              // Update Reachability
              stmt.reachability = reachStatus;

              // Auto-VEX Logic
              if (reachStatus === ReachabilityStatus.NO_EVIDENCE && stmt.status === VexStatus.UNDER_INVESTIGATION) {
                 stmt.status = VexStatus.NOT_AFFECTED;
                 stmt.justification = 'Reachability Analysis: Component not imported in source code';
              }

              await this.vexRepository.save(stmt);
          }
      }
  }


  async findAllByProduct(productId: string, userId: string, query?: any) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      product: {
        id: productId,
        owner: { id: userId },
      },
    };
    if (query?.status) {
      whereClause.status = query.status;
    }

    const [data, total] = await this.vexRepository.findAndCount({
      where: whereClause,
      relations: ['vulnerability', 'product'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, userId: string, dto: UpdateVexStatusDto) {
    const statement = await this.vexRepository.findOne({
      where: { id },
      relations: [
        'product',
        'product.organization',
        'product.organization.users',
      ],
    });

    if (!statement) throw new Error('VEX Statement not found');

    const isMember = statement.product.organization.users.find(
      (u) => u.id === userId,
    );
    if (!isMember) {
      throw new Error('Unauthorized access to VEX statement');
    }

    if (
      dto.status === VexStatus.NOT_AFFECTED &&
      !dto.justification &&
      !statement.justification
    ) {
      throw new Error(
        'Justification is required when setting status to NOT_AFFECTED',
      );
    }

    const oldStatus = statement.status;
    const oldJustification = statement.justification;
    const oldExpiresAt = statement.expiresAt;

    statement.status = dto.status;
    if (dto.justification) statement.justification = dto.justification;
    if (dto.expiresAt !== undefined) statement.expiresAt = dto.expiresAt;

    const saved = await this.vexRepository.save(statement);

    // Update Project Compliance Score
    await this.updateProductCompliance(saved.product.id);

    // Audit Log
    if (oldStatus !== saved.status || oldJustification !== saved.justification) {
        await this.auditService.log(
            userId,
            isMember.email || isMember.id, // Use email as username proxy
            ResourceType.VEX,
            saved.id,
            AuditAction.UPDATE,
            {
                status: oldStatus !== saved.status ? { old: oldStatus, new: saved.status } : undefined,
                justification: oldJustification !== saved.justification ? { old: oldJustification, new: saved.justification } : undefined,
                expiresAt: oldExpiresAt !== saved.expiresAt ? { old: oldExpiresAt, new: saved.expiresAt } : undefined
            },
            `Status updated to ${saved.status}`
        );
    }

    return saved;
  }

  async bulkUpdate(userId: string, dto: BulkUpdateVexDto) {
    const statements = await this.vexRepository.find({
      where: { id: In(dto.ids) },
      relations: [
        'product',
        'product.organization',
        'product.organization.users',
      ],
    });

    if (statements.length === 0) return [];

    const authorizedStatements = statements.filter((stmt) => {
      return stmt.product.organization.users.some((u) => u.id === userId);
    });

    if (authorizedStatements.length === 0) {
      throw new Error('No authorized VEX statements found to update');
    }

    const user = authorizedStatements[0].product.organization.users.find(u => u.id === userId);
    const userName = user ? (user.email || user.id) : userId;

    for (const stmt of authorizedStatements) {
      const oldStatus = stmt.status;
      const oldJustification = stmt.justification;
      
      stmt.status = dto.status;
      if (dto.justification) stmt.justification = dto.justification;

      // Log if changed
      if (oldStatus !== stmt.status || oldJustification !== stmt.justification) {
          // Fire and forget audit to not slow down bulk update too much? 
          // Better `await` to ensure consistency or Promise.all later.
          // For now await is safer.
           await this.auditService.log(
            userId,
            userName,
            ResourceType.VEX,
            stmt.id,
            AuditAction.UPDATE,
            {
                status: oldStatus !== stmt.status ? { old: oldStatus, new: stmt.status } : undefined,
                justification: oldJustification !== stmt.justification ? { old: oldJustification, new: stmt.justification } : undefined
            },
            `Bulk update status to ${stmt.status}`
        );
      }
    }

    const saved = await this.vexRepository.save(authorizedStatements);

    // Update Compliance for affected products
    const productIds = new Set(saved.map(s => s.product.id));
    for (const pid of productIds) {
        await this.updateProductCompliance(pid);
    }

    return saved;
  }

  async count(organizationId: string): Promise<number> {
    return this.vexRepository.count({
      where: {
        product: { organization: { id: organizationId } },
      },
    });
  }

  async countResolved(organizationId: string): Promise<number> {
    return this.vexRepository.count({
      where: [
        {
          status: VexStatus.FIXED,
          product: { organization: { id: organizationId } },
        },
        {
          status: VexStatus.NOT_AFFECTED,
          product: { organization: { id: organizationId } },
        },
      ],
    });
  }

  async countCritical(organizationId: string): Promise<number> {
    return this.vexRepository.count({
      where: [
        {
          vulnerability: { severity: 'CRITICAL' },
          status: VexStatus.AFFECTED,
          product: { organization: { id: organizationId } },
        },
        {
          vulnerability: { severity: 'CRITICAL' },
          status: VexStatus.UNDER_INVESTIGATION,
          product: { organization: { id: organizationId } },
        },
      ],
      relations: ['vulnerability', 'product'],
    });
  }

  async getHistory(vexId: string) {
      return this.auditService.getLogs(ResourceType.VEX, vexId);
  }

  async addTicketRef(vexId: string, ticketKey: string) {
      const stmt = await this.vexRepository.findOne({ where: { id: vexId } });
      if (stmt) {
          stmt.justification = (stmt.justification || '') + ` (Jira Ticket: ${ticketKey})`;
          await this.vexRepository.save(stmt);
          
          // Log system audit
          await this.auditService.log(
             'SYSTEM',
             'Automation Bot',
             ResourceType.VEX,
             vexId,
             AuditAction.UPDATE,
             { justification: { new: stmt.justification } },
             `Created Jira Ticket ${ticketKey}`
          );
      }
  }

  async findRecent(organizationId: string): Promise<VexStatement[]> {
    return this.vexRepository.find({
      order: { id: 'DESC' },
      take: 5,
      relations: ['vulnerability', 'product', 'product.organization'],
      where: {
        product: { organization: { id: organizationId } },
      },
    });
  }

  async findAll(organizationId: string, query?: any) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      product: { organization: { id: organizationId } },
    };
    if (query?.status && query.status !== 'all') {
      whereClause.status = query.status;
    }

    const [data, total] = await this.vexRepository.findAndCount({
      where: whereClause,
      relations: ['vulnerability', 'product'],
      skip,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProductVuln(productId: string, vulnId: string, purl: string) {
    return this.vexRepository.findOne({
      where: {
        product: { id: productId },
        vulnerability: { id: vulnId },
        componentPurl: purl,
      },
    });
  }

  async createAuto(data: {
    product: Product;
    vulnerability: Vulnerability;
    componentPurl: string;
    status: VexStatus;
    justification: string;
  }) {
    const statement = this.vexRepository.create(data);
    return this.vexRepository.save(statement);
  }
  async getProjectActivity(productId: string, limit = 50, offset = 0) {
    const statements = await this.vexRepository.find({
      where: { product: { id: productId } },
      relations: ['vulnerability'],
      select: {
          id: true,
          componentPurl: true,
          vulnerability: {
              id: true
          }
      }
    });

    if (statements.length === 0) return [];

    const vexMap = new Map<string, { vulnId: string; purl: string }>();
    statements.forEach(s => {
        vexMap.set(s.id, { vulnId: s.vulnerability.id, purl: s.componentPurl });
    });

    const vexIds = Array.from(vexMap.keys());
    const logs = await this.auditService.getLogsByResourceIds(ResourceType.VEX, vexIds, limit, offset);

    return logs.map(log => {
        const context = vexMap.get(log.resourceId);
        return {
            id: log.id,
            timestamp: log.timestamp,
            userName: log.userName,
            action: log.action,
            details: log.details,
            changes: log.changes,
            vulnerabilityId: context?.vulnId || 'Unknown',
            componentPurl: context?.purl || 'Unknown'
        };
    });
  }

  async export(productId: string): Promise<any> {
    const product = await this.entityManager.findOne(Product, { where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const statements = await this.vexRepository.find({
      where: { product: { id: productId } },
      relations: ['vulnerability']
    });

    const vulnerabilities = statements.map(stmt => {
      let state = 'in_triage';
      if (stmt.status === VexStatus.AFFECTED) state = 'exploitable';
      if (stmt.status === VexStatus.NOT_AFFECTED) state = 'not_affected';
      if (stmt.status === VexStatus.FIXED) state = 'resolved';
      if (stmt.status === VexStatus.UNDER_INVESTIGATION) state = 'in_triage';

      return {
        id: stmt.vulnerability.id,
        analysis: {
          state: state,
          detail: stmt.justification || '',
          response: [(stmt.status === VexStatus.AFFECTED ? 'will_not_fix' : 'update')]
        },
        affects: [
          {
            ref: stmt.componentPurl
          }
        ]
      };
    });

    return {
      bomFormat: 'CycloneDX',
      specVersion: '1.5',
      version: 1,
      metadata: {
        component: {
          name: product.name,
          version: 'latest',
          type: 'application'
        }
      },
      vulnerabilities: vulnerabilities
    };
  }

  async updateProductCompliance(productId: string) {
    // 1. Fetch statements
    const statements = await this.vexRepository.find({
        where: { product: { id: productId } },
        relations: ['vulnerability']
    });

    // 2. Calculate
    const { score, grade } = this.policyService.calculateCompliance(statements);
    
    // 3. Update Product
    await this.productsService.setComplianceScore(productId, score, grade);
  }
}
