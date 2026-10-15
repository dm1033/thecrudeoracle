import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=new URL('../',import.meta.url);
const output=new URL('dist/',root);
await rm(output,{recursive:true,force:true}); await mkdir(output,{recursive:true});
// Explicit allowlist: never publish APIs, dependencies, admin scripts or private files.
for (const name of ['index.html','terms.html','privacy.html','payment.html','favicon.svg','robots.txt','sitemap.xml','assets']) await cp(new URL(name,root),new URL(name,output),{recursive:true});
console.log(`Static site built: ${fileURLToPath(output)}`);
