import { mkdir, writeFile } from 'node:fs/promises';
import pkg from '../package.json' with { type: 'json' };
await mkdir('dist', { recursive: true });
await writeFile('dist/build-meta.json', JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  source: 'vite-production-build'
}, null, 2) + '\n');
