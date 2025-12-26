import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuditLog, AuditAction, ResourceType } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string,
    userName: string,
    resourceType: ResourceType,
    resourceId: string,
    action: AuditAction,
    changes?: any,
    details?: string,
  ) {
    const log = this.auditRepository.create({
      userId,
      userName,
      resourceType,
      resourceId,
      action,
      changes,
      details,
    });
    return this.auditRepository.save(log);
  }

  async getLogs(resourceType: ResourceType, resourceId: string) {
    return this.auditRepository.find({
      where: { resourceType, resourceId },
      order: { timestamp: 'DESC' },
    });
  }
  
  async getLogsByResourceIds(resourceType: ResourceType, resourceIds: string[], limit = 50, offset = 0) {
    if (resourceIds.length === 0) return [];
    return this.auditRepository.find({
      where: { resourceType, resourceId: In(resourceIds) },
      order: { timestamp: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
