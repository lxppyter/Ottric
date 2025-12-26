import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { SbomModule } from './sbom/sbom.module';
import { VulnModule } from './vuln/vuln.module';
import { VexModule } from './vex/vex.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PortalModule } from './portal/portal.module';
import { GithubModule } from './github/github.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MonitorModule } from './monitor/monitor.module';
import { AnalysisModule } from './analysis/analysis.module';
import { BillingModule } from './billing/billing.module';
import { AuditModule } from './audit/audit.module';
import { IntegrationModule } from './integration/integration.module';
import { AutomationModule } from './automation/automation.module';
import { PolicyModule } from './policies/policy.module';

import { IntegrationsController } from './integrations/integrations.controller';
import { GithubService } from './integrations/github/github.service';
import { SecurityModule } from './common/security/security.module';
import { Product } from './products/entities/product.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development',
    }),
    // Rate Limiting: 100 requests per minute
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USER') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || '123456',
        database: configService.get<string>('DB_NAME') || 'ottric',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Use only for development!
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Product]), 
    ProductsModule,
    SbomModule,
    VulnModule,
    VexModule,
    IngestionModule,
    NotificationsModule,
    PortalModule,
    GithubModule,
    AuthModule,
    UsersModule,
    MonitorModule,
    AnalysisModule,
    BillingModule,
    AuditModule,
    IntegrationModule,
    AutomationModule,
    PolicyModule,
    SecurityModule, // Imported here
  ],
  controllers: [AppController, IntegrationsController],
  providers: [
    AppService,
    GithubService,
    // SecurityService removed (provided by SecurityModule)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
