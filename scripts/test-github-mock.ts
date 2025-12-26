
import { GithubService } from '../src/integrations/github/github.service';
import { Product } from '../src/products/entities/product.entity';

// Force Mock Mode
process.env.MOCK_GITHUB = 'true';

async function runMockTest() {
    console.log('🤖 Starting GitHub Mock Integration Test...\n');

    // 1. Instantiate Service (Dependency is not used in Mock Mode)
    const githubService = new GithubService(null as any);

    // 2. Create Dummy Product
    const mockProduct = new Product();
    mockProduct.name = 'ottric-demo-app';
    mockProduct.repositoryUrl = 'https://github.com/ottric/demo';
    mockProduct.manifestFilePath = 'package.json';
    // Tokens are irrelevant in mock mode
    mockProduct.githubToken = 'encrypted_token'; 
    mockProduct.githubTokenIv = 'iv';

    try {
        // 3. Test Issue Creation
        console.log('--- TEST 1: Create Issue ---');
        const issueUrl = await githubService.createIssue(
            mockProduct,
            'Security Vulnerability Found: log4j',
            'Detailed description of the vulnerability...'
        );
        console.log(`✅ Issue Created: ${issueUrl}\n`);

        // 4. Test PR Creation
        console.log('--- TEST 2: Create Pull Request ---');
        const prUrl = await githubService.createPullRequest(
            mockProduct,
            'log4j',
            '2.17.1',
            'fix(security): upgrade log4j to 2.17.1',
            'Remediates CVE-2021-44228'
        );
        console.log(`✅ PR Created: ${prUrl}\n`);

        console.log('🎉 Mock Test Completed Successfully!');
    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

runMockTest();
