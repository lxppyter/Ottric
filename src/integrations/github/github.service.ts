import { Injectable, BadRequestException } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { Product } from '../../products/entities/product.entity';
import { SecurityService } from '../../common/security/security.service';

@Injectable()
export class GithubService {
  constructor(private securityService: SecurityService) {}

  private getClient(product: Product): Octokit {
    if (!product.githubToken || !product.githubTokenIv) {
        throw new BadRequestException('GitHub integration not configured for this project.');
    }
    const token = this.securityService.decrypt(product.githubToken, product.githubTokenIv);
    return new Octokit({ auth: token });
  }

  private parseRepoUrl(url: string) {
    // Expected format: https://github.com/owner/repo or just owner/repo
    const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(regex);
    if (match) return { owner: match[1], repo: match[2].replace('.git', '') };
    
    const simple = url.split('/');
    if (simple.length === 2) return { owner: simple[0], repo: simple[1] };

    throw new BadRequestException('Invalid Repository URL format.');
  }

  async createIssue(product: Product, title: string, body: string) {
    if (process.env.MOCK_GITHUB === 'true') {
        console.log(`[MOCK] Creating Issue for ${product.name}: ${title}`);
        return `https://github.com/mock/${product.name}/issues/${Math.floor(Math.random() * 1000)}`;
    }

    const octokit = this.getClient(product);
    const { owner, repo } = this.parseRepoUrl(product.repositoryUrl);

    const res = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
    });

    return res.data.html_url;
  }

  async createPullRequest(product: Product, packageName: string, targetVersion: string, title: string, body: string) {
    if (process.env.MOCK_GITHUB === 'true') {
        console.log(`[MOCK] Creating PR for ${product.name}: Upgrade ${packageName} to ${targetVersion}`);
        console.log(`[MOCK] Branch: fix/ottric-${packageName}-${targetVersion}`);
        console.log(`[MOCK] Body: ${body}`);
        return `https://github.com/mock/${product.name}/pull/${Math.floor(Math.random() * 1000)}`;
    }

    const octokit = this.getClient(product);
    const { owner, repo } = this.parseRepoUrl(product.repositoryUrl);
    
    if (!product.manifestFilePath) {
        throw new BadRequestException('Manifest file path is not configured.');
    }

    // 1. Get default branch SHA
    const repoData = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.data.default_branch;
    
    const refData = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
    });
    const baseSha = refData.data.object.sha;

    // 2. Create new branch
    const branchName = `fix/ottric-${packageName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
    await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
    });

    // 3. Get File Content
    let fileSha = '';
    let content = '';
    try {
        const fileData = await octokit.repos.getContent({
            owner,
            repo,
            path: product.manifestFilePath,
            ref: branchName,
        });
        
        if (Array.isArray(fileData.data) || !('content' in fileData.data)) {
             throw new Error('Path is a directory, not a file.');
        }
        
        fileSha = fileData.data.sha;
        content = Buffer.from(fileData.data.content, 'base64').toString('utf8');
    } catch (e) {
        throw new BadRequestException(`Could not read manifest file at ${product.manifestFilePath}`);
    }

    // 4. Update Content (Regex Replace)
    // Simple regex for package.json: "packageName": "x.y.z" -> "packageName": "targetVersion"
    // Limitations: This regex is simplistic.
    const escapedName = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special chars
    const regex = new RegExp(`"${escapedName}"\\s*:\\s*"[^"]+"`, 'g');
    
    if (!regex.test(content)) {
         throw new BadRequestException(`Could not find package "${packageName}" in ${product.manifestFilePath}`);
    }

    const newContent = content.replace(regex, `"${packageName}": "${targetVersion}"`);
    const newContentBase64 = Buffer.from(newContent).toString('base64');

    // 5. Commit File
    await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: product.manifestFilePath,
        message: `fix(deps): upgrade ${packageName} to ${targetVersion} (Ottric)`,
        content: newContentBase64,
        sha: fileSha,
        branch: branchName,
    });

    // 6. Create PR
    const pr = await octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head: branchName,
        base: defaultBranch,
    });

    return pr.data.html_url;
  }
}
