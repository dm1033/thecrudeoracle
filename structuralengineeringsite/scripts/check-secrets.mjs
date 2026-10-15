import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const diff=execFileSync('git',['-C',root,'diff','--cached','--no-ext-diff','--unified=0'],{encoding:'utf8',maxBuffer:20*1024*1024});
const added=diff.split('\n').filter(line=>line.startsWith('+') && !line.startsWith('+++')).join('\n');
if (/(?:[sr]k_(?:live|test)_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,})/.test(added)) {
  console.error('Potential Stripe credential in staged changes. Remove it and use server-only secret storage.');
  process.exitCode=1;
} else console.log('No Stripe credential patterns detected in staged additions.');
