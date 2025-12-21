import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { HeaderAPIKeyStrategy as Strategy } from 'passport-headerapikey';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../users/entities/api-key.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {
    // @ts-ignore
    super({ header: 'x-api-key', prefix: '' }, false, async (apiKey, done) => {
        try {
            const isValid = await this.validate(apiKey);
            if (!isValid) {
                return done(new UnauthorizedException(), null);
            }
            return done(null, isValid);
        } catch (err) {
            return done(err, false);
        }
    });
  }

  async validate(apiKey: string): Promise<any> {
    // We need to iterate over keys or find a way to lookup.
    // Ideally we would store a prefix in plain text or lookup by ID if included in header.
    // But for simplicity (slow) we iterate, OR we require 'prefix_secret' format.
    // Let's assume the key is 'ottric_live_<random>'.
    // A better approach for performance is to require `id:secret` but that's complex for user.
    // For MVP with few keys, we can look up by a prefix if we stored it, or just match all?
    // Actually hashing API keys means we can't lookup directly.
    // Strategy: We will just accept it if we can find a match.
    // Since we don't have many keys, we could fetch all and check? No that's bad.
    
    // Better Design: The key provided to user is `ottric_<id>_<secret>`.
    // We extract ID, lookup record, then verify secret.
    
    const parts = apiKey.split('_');
    if (parts.length < 3) return null; // Expected ottric_live_UUID_SECRET or similar. 
    // Let's stick to simpler: `sk_UUID_SECRET`.
    // sk_e9955..._secretstring...
    
    // If we want to support existing plans, let's just use `uuid` as public ID and a secret.
    // Format: `sk_<uuid>.<secret>`
    
    const [prefix, rest] = apiKey.split('_');
    if (prefix !== 'sk') return null; // Invalid prefix
    
    // Actually let's assume the key is the ID and Secret concatenated?
    // Let's assume the key IS the secret. Without an ID, we can't lookup efficiently.
    // WE MUST CHANGE IMPLEMENTATION PLAN TO USE `Key ID` + `Key Secret` approach if we want efficient lookup.
    
    // REVISION: We will store the full key hash. If the user provides the key, we have to match it.
    // To avoid scanning the table, we usually store a truncated version or ID.
    // Let's say we format the key as `${id}.${secret}`.
    // Then we lookup by ID, and verify hash of secret (or full key).
    
    const dotIndex = apiKey.indexOf('.');
    if (dotIndex === -1) return null;
    
    const id = apiKey.substring(3, dotIndex); // skip 'sk_'
    const secret = apiKey.substring(dotIndex + 1);
    
    // Wait, let's make it simpler. `sk_<base64_id>.<secret>`
    // Or just `uuid.secret` encoded?
    
    // Let's go with: `sk_UUID.SECRET`
    // ID is between `sk_` and `.`.
    const keyId = apiKey.split('.')[0];
    
    // If format is `sk_UUID.SECRET`
    // apiKey = "sk_1234-5678.mySecret"
    // keyId = "sk_1234-5678" -> we need removing sk_?
    
    // Let's use simple logic: Key format `sk_<uuid>.<secret>`
    const actualId = keyId.replace('sk_', '');
    
    const keyEntity = await this.apiKeyRepository.findOne({ 
        where: { id: actualId },
        relations: ['organization']
    });

    if (!keyEntity) return null;

    const isMatch = await bcrypt.compare(apiKey, keyEntity.keyHash);
    if (isMatch) {
         // Update last used
        //  await this.apiKeyRepository.update(keyEntity.id, { lastUsedAt: new Date() });
         // Return organization as user
         return {
             id: 'system',
             organizationId: keyEntity.organization.id,
             organizationName: keyEntity.organization.name,
             roles: ['api']
         };
    }
    return null;
  }
}
