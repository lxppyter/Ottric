import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JiraService } from './jira/jira.service';
import { IntegrationType } from './entities/integration-config.entity';

@ApiTags('Integrations')
@Controller('integration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationController {
    constructor(private jiraService: JiraService) {}

    @Get(':type')
    @ApiOperation({ summary: 'Get integration config' })
    async getConfig(@Param('type') type: IntegrationType, @Request() req) {
        // In a real app, use a generic service. For now, we only have Jira logic tailored.
        // We'll add a generic method to JiraService (which implements generic logic too?) or separate ConfigService.
        // Let's implement generic CRUD in JiraService for now as it Is the integration service.
        return this.jiraService.getConfig(req.user.organizationId, type);
    }

    @Put(':type')
    @ApiOperation({ summary: 'Update integration config' })
    async updateConfig(@Param('type') type: IntegrationType, @Body() config: any, @Request() req) {
        return this.jiraService.saveConfig(req.user.organizationId, type, config);
    }
}
