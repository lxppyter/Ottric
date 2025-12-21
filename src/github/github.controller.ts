import { Controller, Post, Headers, Body } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post('webhook')
  async handleWebhook(@Headers() headers: any, @Body() payload: any) {
    return this.githubService.processWebhook(headers, payload);
  }
}
