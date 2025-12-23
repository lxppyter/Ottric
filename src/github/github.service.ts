import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class GithubService {
  private readonly webhookSecret =
    process.env.GITHUB_WEBHOOK_SECRET || 'my-secret';

  async processWebhook(headers: any, payload: any) {
    // 1. Verify Signature
    const signature = headers['x-hub-signature-256'];
    if (!this.verifySignature(JSON.stringify(payload), signature)) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 2. Handle Events
    const event = headers['x-github-event'];
    console.log(`Received GitHub Event: ${event}`);

    if (event === 'workflow_run') {
      await this.handleWorkflowRun(payload);
    } else if (event === 'ping') {
      console.log('GitHub Ping Received');
    }

    return { received: true };
  }

  private verifySignature(payload: string, signature: string): boolean {
    if (!signature) return false; // For dev, maybe allow? No, secure by default.
    // If no secret configured, maybe skip?
    if (this.webhookSecret === 'my-secret') {
      console.warn(
        'Using default webhook secret! Please set GITHUB_WEBHOOK_SECRET.',
      );
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  private async handleWorkflowRun(payload: any) {
    const action = payload.action;
    const run = payload.workflow_run;

    if (action === 'completed' && run) {
      console.log(
        `Workflow ${run.name} (ID: ${run.id}) completed with conclusion: ${run.conclusion}`,
      );
      console.log(`Repository: ${payload.repository.full_name}`);
      console.log(`Commit: ${run.head_sha}`);

      if (run.conclusion === 'success') {
        console.log('Use Octokit here to fetch artifacts (SBOM)...');
        // TODO: Implement artifact download logic
      }
    }
  }
}
