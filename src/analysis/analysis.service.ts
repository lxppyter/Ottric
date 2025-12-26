import { Injectable } from '@nestjs/common';
import { Sbom } from '../sbom/entities/sbom.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AnalysisService {
  /**
   * Analyzes the project source code to check if SBOM components are potentially imported.
   * Returns a map of package name -> specific file paths where it was imported.
   */
  async analyzeReachability(
    projectPath: string,
    sbom: Sbom,
  ): Promise<Map<string, string[]>> {
    const components = sbom.content?.components || [];
    if (!components.length) {
      return new Map();
    }

    // Extract package names from PURLs or component names
    // PURL format: pkg:npm/axios@0.21.1 -> axios
    // PURL format: pkg:npm/@nestjs/common@1.0.0 -> @nestjs/common
    const packageMap = new Map<string, string>(); // name -> purl
    
    components.forEach((c) => {
        if (c.purl && c.type !== 'operating-system') { // Skip OS packages
            // Simplified name extraction from PURL or use name field
            // pkg:npm/scope/name@version
            // pkg:npm/name@version
            // We can rely on c.name usually for NPM/PyPI
            if (c.name) {
                packageMap.set(c.name, c.purl);
            }
        }
    });

    const importedPackages = new Map<string, string[]>(); // package -> files[]

    if (!fs.existsSync(projectPath)) {
        console.warn(`Project path ${projectPath} does not exist. Skipping analysis.`);
        return importedPackages;
    }

    // Recursive scan
    this.scanDirectory(projectPath, packageMap, importedPackages);

    // --- Transitive Reachability Analysis ---
    if (sbom.content && Array.isArray(sbom.content.dependencies)) {
        const dependencyGraph = this.buildDependencyGraph(sbom.content.dependencies);
        
        // 1. Identify Root PURLs (Directly Imported)
        const rootPurls = new Set<string>();
        for (const [pkgName, files] of importedPackages) {
            if (files.length > 0) {
                const purl = packageMap.get(pkgName);
                if (purl) rootPurls.add(purl);
            }
        }

        // 2. BFS Traversal
        const allReachablePurls = this.traverseGraph(rootPurls, dependencyGraph);

        // 3. Mark transitive dependencies as reachable in the result map
        // We need to reverse map PURL -> Package Name to update the map
        const purlToName = new Map<string, string>();
        packageMap.forEach((v, k) => purlToName.set(v, k));

        for (const purl of allReachablePurls) {
            const name = purlToName.get(purl);
            if (name && !importedPackages.has(name)) {
                // Mark as reachable (Transitive)
                importedPackages.set(name, ['Transitive Dependency']); 
            }
        }
    }

    return importedPackages;
  }

  private buildDependencyGraph(dependencies: any[]): Map<string, string[]> {
      const graph = new Map<string, string[]>();
      for (const dep of dependencies) {
          if (dep.ref && Array.isArray(dep.dependsOn)) {
              graph.set(dep.ref, dep.dependsOn);
          }
      }
      return graph;
  }

  private traverseGraph(roots: Set<string>, graph: Map<string, string[]>): Set<string> {
      const visited = new Set<string>(roots);
      const queue = Array.from(roots);

      while (queue.length > 0) {
          const current = queue.shift();
          if (!current) continue;

          const neighbors = graph.get(current) || [];
          for (const neighbor of neighbors) {
              if (!visited.has(neighbor)) {
                  visited.add(neighbor);
                  queue.push(neighbor);
              }
          }
      }
      return visited;
  }

  private scanDirectory(
    dir: string, 
    targets: Map<string, string>, 
    results: Map<string, string[]>
  ) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (this.shouldIgnore(file)) continue;
        this.scanDirectory(fullPath, targets, results);
      } else if (stat.isFile()) {
        if (this.isCodeFile(file)) {
            this.checkFileForImports(fullPath, targets, results);
        }
      }
    }
  }

  private shouldIgnore(dirName: string): boolean {
      const ignores = ['node_modules', '.git', 'dist', 'build', 'coverage', '.idea', '.vscode'];
      return ignores.includes(dirName);
  }

  private isCodeFile(fileName: string): boolean {
      const ext = path.extname(fileName).toLowerCase();
      // Add more as needed (py, go, java, etc.)
      return ['.ts', '.js', '.tsx', '.jsx', '.mjs', '.cjs'].includes(ext);
  }

  /* --- Typosquatting Analysis --- */

  // Top packages to check against (Demo subset)
  private readonly GOLDEN_PACKAGES = [
    'react', 'react-dom', 'next', 'express', 'lodash', 'axios', 'ts-node', 'typescript',
    'commander', 'chalk', 'inquirer', 'request', 'moment', 'dayjs', 'uuid', 'classnames',
    'prop-types', 'webpack', 'babel', 'eslint', 'jest', 'rxjs', 'vue', 'angular', 'jquery',
    'bootstrap', 'tailwindcss', 'postcss', 'autoprefixer'
  ];

  async analyzeTyposquatting(sbom: Sbom): Promise<any[]> {
      const components = sbom.content?.components || [];
      const findings: any[] = []; // Explicit type

      for (const component of components) {
          const name = component.name?.toLowerCase();
          if (!name) continue;

          // Skip if exact match (it's the real package)
          if (this.GOLDEN_PACKAGES.includes(name)) continue;

          // Check distance
          for (const golden of this.GOLDEN_PACKAGES) {
              // Only check if lengths are close (optimization)
              if (Math.abs(name.length - golden.length) > 2) continue;

              const distance = this.levenshtein(name, golden);
              
              // Threshold: Distance 1 (e.g. 'reacct' vs 'react') 
              // BUT exclude version numbers if included in name accidentally
              if (distance === 1) {
                   findings.push({
                       component: name,
                       target: golden,
                       distance,
                       type: 'TYPOSQUATTING',
                       purl: component.purl
                   });
              }
          }
      }

      return findings;
  }

  private levenshtein(a: string, b: string): number {
      const matrix: number[][] = [];

      for (let i = 0; i <= b.length; i++) {
          matrix[i] = [i];
      }

      for (let j = 0; j <= a.length; j++) {
          matrix[0][j] = j;
      }

      for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
              if (b.charAt(i - 1) === a.charAt(j - 1)) {
                  matrix[i][j] = matrix[i - 1][j - 1];
              } else {
                  matrix[i][j] = Math.min(
                      matrix[i - 1][j - 1] + 1, // substitution
                      Math.min(
                          matrix[i][j - 1] + 1, // insertion
                          matrix[i - 1][j] + 1 // deletion
                      )
                  );
              }
          }
      }

      return matrix[b.length][a.length];
  }

  // --- Malicious Signal Analysis ---

  private readonly KNOWN_MALICIOUS_PACKAGES = [
      'peacnot', 'noblesse', 'harmful-pkg', 'malware-test', 'poc-exploit'
  ];

  private readonly SUSPICIOUS_KEYWORDS = [
      'reverse shell', 'remote access', 'stealer', 'keylogger', 'c2', 'command and control',
      'exploit kit', 'pwn', 'backdoor', 'trojan'
  ];

  async analyzeMaliciousSignals(sbom: Sbom): Promise<any[]> {
      const components = sbom.content?.components || [];
      const findings: any[] = [];

      for (const component of components) {
          const name = component.name?.toLowerCase();
          const description = component.description?.toLowerCase() || '';
          
          if (!name) continue;

          // 1. Blacklist Check
          if (this.KNOWN_MALICIOUS_PACKAGES.includes(name)) {
              findings.push({
                  component: name,
                  type: 'KNOWN_MALICIOUS',
                  severity: 'CRITICAL',
                  details: `Package '${name}' is on the known malicious package list.`
              });
              continue;
          }

          // 2. Heuristic Check (Keywords in Description/Name)
          for (const keyword of this.SUSPICIOUS_KEYWORDS) {
              if (name.includes(keyword) || description.includes(keyword)) {
                   findings.push({
                       component: name,
                       type: 'SUSPICIOUS_KEYWORD',
                       severity: 'HIGH',
                       details: `Package '${name}' contains suspicious keyword '${keyword}' in metadata. Description: ${description.slice(0, 50)}...`
                   });
                   break; // Report once per package
              }
          }
      }

      return findings;
  }

  // --- Provenance / Integrity Analysis ---

  async analyzeProvenance(sbom: Sbom): Promise<any[]> {
      const content = sbom.content || {};
      const findings: any[] = [];

      // Check 1: CycloneDX 'signature' field (root level)
      // Spec: https://cyclonedx.org/docs/1.4/json/#signature
      const hasSignature = !!content.signature;

      // Check 2: Metadata tools (Heuristic)
      // Sometimes tools sign externally but mention it in metadata.tools
      // This is a weak check, but worth noting.

      if (!hasSignature) {
          findings.push({
              component: 'ROOT_SBOM',
              type: 'UNSIGNED_SBOM',
              severity: 'MEDIUM', // or HIGH depending on policy
              details: 'This SBOM is not digitally signed. Its integrity cannot be verified. Attackers could have tampered with the file before upload.'
          });
      }

      return findings;
  }

  /* --- Helper Methods --- */

  private checkFileForImports(
      filePath: string, 
      targets: Map<string, string>, 
      results: Map<string, string[]>
  ) {
      try {
          const content = fs.readFileSync(filePath, 'utf-8');
          // Regex for JS/TS imports
          // import ... from 'pkg'
          // require('pkg')
          // import('pkg')
          
          // Capture content inside quotes
          const importRegex = /(?:import\s+.*?from\s+['"]([^'"]+)['"])|(?:require\(['"]([^'"]+)['"]\))|(?:import\(['"]([^'"]+)['"]\))/g;
          
          let match;
          while ((match = importRegex.exec(content)) !== null) {
              // Group 1: import from
              // Group 2: require
              // Group 3: dynamic import
              const modulePath = match[1] || match[2] || match[3];
              if (!modulePath) continue;

              // modulePath could be '@nestjs/common', 'fs', './local', 'lodash/fp'
              // We need to match it against target package names.
              // Logic: does modulePath START with package name?
              // e.g. import 'lodash/fp' matches 'lodash'
              
              if (modulePath.startsWith('.')) continue; // Local import/relative
              
              for (const [pkgName, _] of targets) {
                  // Strict check: modulePath === pkgName OR modulePath starts with pkgName + '/'
                  if (modulePath === pkgName || modulePath.startsWith(pkgName + '/')) {
                      // Found match!
                      if (!results.has(pkgName)) {
                          results.set(pkgName, []);
                      }
                      // dedupe files
                      if (!results.get(pkgName)!.includes(filePath)) {
                          results.get(pkgName)!.push(filePath);
                      }
                  }
              }
          }

      } catch (e) {
          console.error(`Error analyzing file ${filePath}:`, e);
      }
  }
}
