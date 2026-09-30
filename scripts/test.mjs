import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

await rm('.test-build', { recursive: true, force: true });
for (const [cmd, args] of [
  ['node_modules/.bin/tsc', ['-p', 'tsconfig.test.json']],
  [process.execPath, ['--test', 'tests/core.test.mjs', 'tests/demo.test.mjs', 'tests/charts.test.mjs', 'tests/examples.test.mjs', 'tests/feedback.test.mjs', 'tests/controls.test.mjs', 'tests/navigation.test.mjs', 'tests/studio.test.mjs', 'tests/preview.test.mjs', 'tests/dashboard-craft.test.mjs']],
]) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
