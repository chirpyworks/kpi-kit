import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const tracked = spawnSync('git', ['ls-files'], { encoding: 'utf8' });
if (tracked.status !== 0) throw new Error('git ls-files failed.');
const files = tracked.stdout.trim().split(/\r?\n/).filter(Boolean);

const required = [
  'README.md','README.ko.md','LICENSE','CONTRIBUTING.md','SECURITY.md','THIRD_PARTY_NOTICES.md',
  'package.json','index.html','kit.html','src/kit/index.ts','src/kit/styles.css','src/demo/Explorer.tsx',
  'public/examples/metrics.json','.github/workflows/verify.yml'
];
for (const file of required) if (!files.includes(file)) throw new Error(`Missing tracked file: ${file}`);

const forbidden = /^(node_modules|dist|\.test-build|artifacts|__pycache__)\//;
for (const file of files) if (forbidden.test(file) || /(^|\/)\.env(\.|$)/.test(file)) throw new Error(`Forbidden tracked path: ${file}`);

const risky = [/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/, /ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/, /sk-proj-[A-Za-z0-9_-]{20,}/];
for (const file of files.filter(f=>/\.(md|json|ya?ml|tsx?|mjs|cjs|py|html|css|svg)$/.test(f))) {
  const body=await readFile(file,'utf8');
  for (const pattern of risky) if (pattern.test(body)) throw new Error(`Potential secret pattern in ${file}`);
}
const readme=await readFile('README.md','utf8');
for (const stale of ['docs/images/','public/sample-data.json','commerce dashboard']) {
  if (readme.includes(stale)) throw new Error(`Stale README reference: ${stale}`);
}
console.log(`Repository hygiene passed for ${files.length} tracked files.`);
