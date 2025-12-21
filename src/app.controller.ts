import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@Req() req) {
    return this.appService.getDashboardStats(req.user.organizationId);
  }
}
