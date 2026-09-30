import { mkdir, writeFile, readFile } from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };
await mkdir('dist', { recursive: true });
await writeFile('dist/build-meta.json', JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  source: 'vite-production-build'
}, null, 2) + '\n');

// Preserve the project and every bundled production dependency's full license.
let notices = 'KPI Kit — project and bundled runtime licenses\n\n' + await readFile('LICENSE', 'utf8');
for (const name of ['react', 'react-dom', 'scheduler']) {
  const dependency = JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8'));
  notices += `\n\n--- ${name} ${dependency.version} ---\n\n` + await readFile(`node_modules/${name}/LICENSE`, 'utf8');
}
await writeFile('dist/LICENSES.txt', notices);
await writeFile('dist/LICENSE', await readFile('LICENSE', 'utf8'));
