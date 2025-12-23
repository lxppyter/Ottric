import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { OrganizationController } from './organization.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Invitation } from './entities/invitation.entity';
import { ApiKey } from './entities/api-key.entity';
import { PersonalNotification } from './entities/personal-notification.entity';
import { Waitlist } from './entities/waitlist.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      Invitation,
      ApiKey,
      PersonalNotification,
      Waitlist,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [UsersController, OrganizationController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
