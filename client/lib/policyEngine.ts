export interface PolicySuggestion {
    id: string;
    title: string;
    description: string;
    mitigationText: string;
}

const POLICIES: { keywords: string[]; suggestion: PolicySuggestion }[] = [
    {
        keywords: ['remote code execution', 'rce', 'code execution', 'command injection'],
        suggestion: {
            id: 'RCE-MITIGATION',
            title: 'Critical: Remote Code Execution Risk',
            description: 'RCE vulnerabilities pose the highest risk. If patching is not possible, strict network and runtime isolation is required.',
            mitigationText: `MITIGATION PLAN (Policy RCE-01):
1. Network Isolation: Ensure the service has NO outbound internet access (egress filtering) to prevent C2 communication.
2. Read-Only Filesystem: Mount the container/service root filesystem as read-only.
3. Least Privilege: Run the service as a non-root user with minimal Linux capabilities (drop ALL, add only needed).
4. WAF Rule: Enable strict RCE signatures in the WAF (Web Application Firewall) blocking common shell commands.`
        }
    },
    {
        keywords: ['sql injection', 'sqli', 'database injection'],
        suggestion: {
            id: 'SQLI-MITIGATION',
            title: 'High: SQL Injection Risk',
            description: 'SQL injection allows attackers to steal or manipulate database data. Input validation alone is often insufficient.',
            mitigationText: `MITIGATION PLAN (Policy SQL-01):
1. Prepared Statements: Verify that ALL database queries use parameterized queries or an ORM.
2. WAF Enforcement: Enable SQL Injection protection rules on the WAF/Gateway level.
3. IDPS Monitoring: Configure Database Activity Monitoring to alert on abnormal query patterns or bulk data extraction.
4. Principle of Least Privilege: Ensure the database user has only DML permissions (SELECT/INSERT/UPDATE) and no DDL/Administrative rights.`
        }
    },
    {
        keywords: ['cross-site scripting', 'xss', 'cross site scripting'],
        suggestion: {
            id: 'XSS-MITIGATION',
            title: 'Medium: Cross-Site Scripting (XSS)',
            description: 'XSS allows attackers to execute scripts in user browsers. CSP is the most effective defense if code changes are difficult.',
            mitigationText: `MITIGATION PLAN (Policy XSS-01):
1. Content Security Policy (CSP): Implement a strict CSP header disabling 'unsafe-inline' and 'unsafe-eval'.
2. Input Sanitization: Ensure all user input is HTML-encoded on output.
3. Cookie Security: Set 'HttpOnly' and 'Secure' flags on all session cookies to prevent theft via XSS.
4. WAF filtering: Enable XSS instruction detection on the ingress controller.`
        }
    },
    {
        keywords: ['deserialization', 'serialize', 'pickle', 'yaml', 'object injection'],
        suggestion: {
            id: 'DESER-MITIGATION',
            title: 'Critical: Insecure Deserialization',
            description: 'Deserialization attacks can lead to RCE. Validating the type of incoming objects is crucial.',
            mitigationText: `MITIGATION PLAN (Policy DESER-01):
1. Type Validation: Implement strict whitelist-based type validation before deserialization.
2. Network Segmentation: Isolate the processing worker from the public internet.
3. Fallback: If possible, switch to a safe data format like JSON instead of language-specific serialization (e.g. Java Serialized Object).`
        }
    },
    {
        keywords: ['denial of service', 'dos', 'resource consumption', 'loop', 'memory leak'],
        suggestion: {
            id: 'DOS-MITIGATION',
            title: 'Medium: Denial of Service Risk',
            description: 'DoS attacks exhaust resources. Rate limiting is the primary defense.',
            mitigationText: `MITIGATION PLAN (Policy DOS-01):
1. Rate Limiting: Implement aggressive rate limiting per IP/User at the API Gateway.
2. Resource Quotas: Set strict CPU and Memory limits (cgroups/Kubernetes limits) on the container.
3. Timeouts: Ensure all upstream connections have short timeouts (e.g. 5s) to prevent thread exhaustion.`
        }
    },
    {
        keywords: ['ssrf', 'server side request forgery', 'server-side request forgery'],
        suggestion: {
            id: 'SSRF-MITIGATION',
            title: 'High: Server-Side Request Forgery (SSRF)',
            description: 'SSRF allows the server to query internal resources. Egress filtering is mandatory.',
            mitigationText: `MITIGATION PLAN (Policy SSRF-01):
1. Egress Filtering: Block ALL outbound traffic to internal IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254).
2. DNS Resolution: Use a restricted DNS resolver that resolves only to allowed external domains.
3. Input Validation: Whitelist allowed URL schemas (http/https only) and target domains.`
        }
    },
    {
        keywords: ['path traversal', 'directory traversal', 'local file inclusion', 'lfi'],
        suggestion: {
            id: 'PATH-MITIGATION',
            title: 'High: Path Traversal / LFI',
            description: 'Attackers can read arbitrary files. Chroot and input validation are key.',
            mitigationText: `MITIGATION PLAN (Policy PATH-01):
1. Chroot/Jail: Run the process inside a chrooted environment or restricted container context.
2. Input Sanitization: Stripping "../" is often insufficient. Use distinct filenames mapped to IDs.
3. WAF Rules: Enable LFI/Path Traversal signatures to block requests containing directory traversal patterns.`
        }
    },
    {
        keywords: ['ott-typo', 'typosquatting', 'similar to', 'levenshtein'],
        suggestion: {
            id: 'TYPO-MITIGATION',
            title: 'Supply Chain Risk: Potential Typosquatting',
            description: 'This package name is deceptively similar to a popular package. It may be malicious.',
            mitigationText: `MITIGATION PLAN (Policy SC-01):
1. Verify Authenticity: Check the package Author, Download Count, and Release Date on the official registry (NPM/PyPI).
2. Deep Code Audit: Inspect the source code for obfuscated scripts or network calls to unknown domains.
3. Remove if Suspicious: If confirmed as an attack or mistake, remove it immediately and install the correct package.
4. If False Positive: If this is an internal or valid package causing a collision, mark as 'Not Affected' (False Positive).`
        }
    },
    {
        keywords: ['ott-mal', 'malicious signal', 'known malicious'],
        suggestion: {
            id: 'MAL-MITIGATION',
            title: 'Critical: Malicious Package Detected',
            description: 'A package with strong indicators of malware has been detected.',
            mitigationText: `MITIGATION PLAN (Policy SC-02):
1. IMMEDIATE REMOVAL: Remove this package from package.json and lockfiles immediately.
2. ROTATE SECRETS: Assume the build environment and environment variables are compromised. Rotate ALL secrets (AWS keys, DB passwords, NPM tokens).
3. ISOLATE ENVIRONMENT: Take the affected build agent or developer machine offline for forensic analysis.
4. INCIDENT RESPONSE: Trigger the internal security incident response workflow.`
        }
    },
    {
        keywords: ['ott-unsigned-sbom', 'unsigned sbom', 'untrusted integrity'],
        suggestion: {
            id: 'PROVENANCE-MITIGATION',
            title: 'Supply Chain Risk: Unsigned SBOM',
            description: 'The SBOM is not digitally signed, so its integrity cannot be verified.',
            mitigationText: `MITIGATION PLAN (Policy SC-03):
1. ENABLE SIGNING: Use Cosign (Sigstore) or Notation to sign the SBOM file in your CI/CD pipeline immediately after generation.
   Example: cosign sign-blob --key cosign.key sbom.json > sbom.json.sig
2. VERIFY INGESTION: Configure your policy to reject any SBOM that lacks a valid signature.
3. SECURE PIPELINE: Ensure the CI/CD runner is ephemeral and secrets are injected securely via OIDC.`
        }
    }
];

export function getPolicySuggestion(vulnerability: any): PolicySuggestion | null {
    if (!vulnerability) return null;

    const text = `${vulnerability.id} ${vulnerability.summary || ''} ${vulnerability.details || ''}`.toLowerCase();

    // Priority based matching (first match wins)
    for (const policy of POLICIES) {
        if (policy.keywords.some(k => text.includes(k))) {
            return policy.suggestion;
        }
    }

    // Default fallback calculation based on Severity if no keywords match?
    // For now, return null to avoid generic noise.
    return null;
}
