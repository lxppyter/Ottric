
import { Injectable } from '@nestjs/common';
import { VexStatement, VexStatus } from '../vex/entities/vex-statement.entity';

@Injectable()
export class PolicyService {
  
  /**
   * Calculates the Compliance Score (0-100) and Grade (A-F) based on VEX Statements.
   */
  calculateCompliance(statements: VexStatement[]): { score: number; grade: string } {
    let score = 100;

    // Filter active risks
    const activeRisks = statements.filter(stmt => 
        stmt.status !== VexStatus.NOT_AFFECTED && 
        stmt.status !== VexStatus.FIXED
    );

    for (const stmt of activeRisks) {
      const rawSev = stmt.vulnerability?.severity;
      const severity = this.getNormalizedSeverity(rawSev);

      if (severity === 'CRITICAL') score -= 20;
      else if (severity === 'HIGH') score -= 10;
      else if (severity === 'MEDIUM') score -= 2;
    }

    if (score < 0) score = 0;

    const grade = this.itemToGrade(score);

    return { score, grade };
  }

  private getNormalizedSeverity(rawSev: any): string {
      const sev = rawSev ? String(rawSev).toUpperCase() : '';
      
      if (sev.startsWith('CVSS:')) {
          let impactCount = 0;
          if (sev.includes('C:H') || sev.includes('VC:H')) impactCount++;
          if (sev.includes('I:H') || sev.includes('VI:H')) impactCount++;
          if (sev.includes('A:H') || sev.includes('VA:H')) impactCount++;
          
          if (impactCount === 3) return 'CRITICAL';
          if (impactCount >= 1) return 'HIGH'; // Even 1 High impact is risky enough for Policy
          return 'MEDIUM';
      }

      if (sev === 'MODERATE') return 'MEDIUM';
      
      // Default return if it matches standard keys
      return sev;
  }



  private itemToGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}
