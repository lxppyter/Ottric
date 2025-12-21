import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.development',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'ottric',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Use only for development!
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
