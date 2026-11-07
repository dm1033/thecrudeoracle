import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

const LIVE_ORIGIN = 'https://www.temporaryworksconsulting.com';

function rewritePreviewHtml(html) {
  return html
    .replace(
      /(href|src)=["']\/assets\/(?!images\/tools\/breeam-scorer\.svg)([^"']+)["']/g,
      `$1="${LIVE_ORIGIN}/assets/$2"`
    )
    .replace(/srcset=["']([^"']+)["']/g, (_match, val) => {
      const updated = val.replace(
        /(^|,\s*)\/assets\/(?!images\/tools\/breeam-scorer\.svg)/g,
        `$1${LIVE_ORIGIN}/assets/`
      );
      return `srcset="${updated}"`;
    })
    .replace(/imagesrcset=["']([^"']+)["']/g, (_match, val) => {
      const updated = val.replace(
        /(^|,\s*)\/assets\/(?!images\/tools\/breeam-scorer\.svg)/g,
        `$1${LIVE_ORIGIN}/assets/`
      );
      return `imagesrcset="${updated}"`;
    })
    .replace(/s\.src="\/assets\/js\/([^"]+)"/g, `s.src="${LIVE_ORIGIN}/assets/js/$1"`);
}

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
  for (const page of ['index.html', 'tools.html', 'seatsprep.html']) {
    const pagePath = resolve(twcIntegrationDest, page);
    if (existsSync(pagePath)) {
      const raw = readFileSync(pagePath, 'utf8');
      writeFileSync(pagePath, rewritePreviewHtml(raw), 'utf8');
    }
  }
}

// Also generate a single-file portable HTML version (breeam-scoring-tool.html) that can be dropped directly into temporaryworksconsulting.com root
writeFileSync(
  resolve(distDir, '_redirects'),
  '/breeam.html /index.html 200\n/breeam-calculator /index.html 200\n'
);

console.log('Built BREEAM Construction Project Scoring Tool to dist/ and dist/breeam-scoring-tool/');
