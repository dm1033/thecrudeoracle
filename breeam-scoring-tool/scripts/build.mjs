import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}
mkdirSync(distDir, { recursive: true });
mkdirSync(resolve(distDir, 'breeam-scoring-tool'), { recursive: true });

// Copy to root of dist/ AND to dist/breeam-scoring-tool/ so both root and subpath deployments work seamlessly
for (const target of [distDir, resolve(distDir, 'breeam-scoring-tool')]) {
  cpSync(resolve(rootDir, 'index.html'), resolve(target, 'index.html'));
  cpSync(resolve(rootDir, 'favicon.svg'), resolve(target, 'favicon.svg'));
  cpSync(resolve(rootDir, 'assets'), resolve(target, 'assets'), { recursive: true });
}

// Copy temporaryworksconsulting.com site integration bundle into dist/twc-site-integration/
const twcIntegrationSrc = resolve(rootDir, 'twc-site-integration');
if (existsSync(twcIntegrationSrc)) {
  const twcIntegrationDest = resolve(distDir, 'twc-site-integration');
  cpSync(twcIntegrationSrc, twcIntegrationDest, { recursive: true });
  cpSync(resolve(distDir, 'breeam-scoring-tool'), resolve(twcIntegrationDest, 'breeam-scoring-tool'), { recursive: true });
}

// Also generate a single-file portable HTML version (breeam-scoring-tool.html) that can be dropped directly into temporaryworksconsulting.com root
writeFileSync(
  resolve(distDir, '_redirects'),
  '/breeam.html /index.html 200\n/breeam-calculator /index.html 200\n'
);

console.log('Built BREEAM Construction Project Scoring Tool to dist/ and dist/breeam-scoring-tool/');
