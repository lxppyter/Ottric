import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityService {
  private readonly algorithm = 'aes-256-cbc';
  // Fallback key for demo purposes if env is missing (DO NOT USE IN REAL PROD without env)
  private readonly key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'ottric-secret-key-salt', 'salt', 32);

  constructor(private configService: ConfigService) {}

  encrypt(text: string): { content: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      content: encrypted,
      iv: iv.toString('hex'),
    };
  }

  decrypt(encrypted: string, ivHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
