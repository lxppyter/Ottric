import { Injectable } from '@nestjs/common';
import { Vulnerability } from './entities/vulnerability.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class RiskService {
  calculateRiskScore(vuln: Vulnerability, product: Product): number {
    // 1. Base Score from CVSS (or severity mapping)
    let baseScore = 0;
    const sev = vuln.severity ? String(vuln.severity).toUpperCase() : '';
    
    // Check if severity is a number (CVSS) or string
    if (typeof vuln.severity === 'number') {
        baseScore = vuln.severity;
    } else if (sev.startsWith('CVSS:')) {
        // Simple Heuristic for CVSS Vector
        // CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H -> Critical (~9.8)
        // Check for Impacts
        let impactCount = 0;
        if (sev.includes('C:H') || sev.includes('VC:H')) impactCount++;
        if (sev.includes('I:H') || sev.includes('VI:H')) impactCount++;
        if (sev.includes('A:H') || sev.includes('VA:H')) impactCount++;
        
        if (impactCount === 3) baseScore = 9.8; // Critical
        else if (impactCount === 2) baseScore = 8.5; // High
        else if (impactCount === 1) baseScore = 7.0; // High/Medium
        else baseScore = 5.0; // Medium default
    } else if (sev) {
        // Map string severity to roughly CVSS equivalent
        switch (sev) {
            case 'CRITICAL': baseScore = 9.5; break;
            case 'HIGH': baseScore = 8.0; break;
            case 'MEDIUM': baseScore = 5.5; break;
            case 'LOW': baseScore = 2.0; break;
            case 'MODERATE': baseScore = 5.5; break; // Common in GitHub/NPM
            case 'MODERATE': baseScore = 5.5; break; // Common in GitHub/NPM
            default: baseScore = 0.0;
        }
    } else {
        baseScore = 0;
    }

    // 2. Apply Multipliers
    let multiplier = 1.0;

    // Environment Multiplier
    // Defensive check for product
    if (product) {
        if (product.environment === 'PRODUCTION') multiplier += 0.5; // +50% risk
        else if (product.environment === 'STAGING') multiplier += 0.1; // +10% risk

        // Internet Facing Multiplier
        if (product.isInternetFacing) multiplier += 0.2; // +20% risk

        // Criticality Multiplier
        if (product.criticality) {
            switch (product.criticality) {
                case 'CRITICAL': multiplier += 0.3; break;
                case 'HIGH': multiplier += 0.1; break;
                case 'LOW': multiplier -= 0.1; break; 
            }
        }
    }

    // 3. Calculate Final Score
    // Calculate Static Score first
    let staticScore = baseScore * multiplier;

    // 4. Apply Dynamic Intel (EPSS / KEV)
    
    // KEV Rule: If currently exploited, it's CRITICAL immediately.
    // We set a minimum floor for KEV items.
    if (vuln.isKev) {
        // Boost significantly. If base was low, pull it up.
        // If it was already high, keep it high.
        // Let's ensure KEV items are at least 90 (Critical zone).
        if (staticScore * 10 < 90) {
            staticScore = 9.0; // 9.0 * 10 = 90
            multiplier = 1.0; // Reset multiplier logic effect roughly
        }
    }

    // EPSS Rule:
    // EPSS is a probability 0-1.
    // If EPSS > 0.01 (1%), it's significant compared to noise.
    // If EPSS > 0.1 (10%), it's very high risk.
    // Formula: Adjusted = Static * (1 + EPSS * Factor)
    // Let's say Factor = 5. So 10% EPSS adds 50% to the score.
    // 0.2 EPSS doubles the risk.
    if (vuln.epssScore) {
        const epssFactor = 1 + (vuln.epssScore * 5); // Max possible (1.0 * 5) + 1 = 6x (huge)
        staticScore = staticScore * epssFactor;
    }

    // 5. Normalization
    let adjustedScore = staticScore * 10;
    
    // Cap at 100
    if (adjustedScore > 100) adjustedScore = 100;
    if (adjustedScore < 0) adjustedScore = 0;

    return Math.round(adjustedScore);
  }

  calculateProjectRiskScore(product: Product, vulnerabilities: Vulnerability[]): number {
      // Simple aggregation: Sum of risk scores? Or Max risk score?
      // Usually "Max Risk" defines the project state.
      // Or "Weighted Sum".
      // Let's go with: Max Risk Score of any single open vulnerability.
      
      let maxScore = 0;
      for (const vuln of vulnerabilities) {
          const score = this.calculateRiskScore(vuln, product);
          if (score > maxScore) maxScore = score;
      }
      return maxScore;
  }
}
