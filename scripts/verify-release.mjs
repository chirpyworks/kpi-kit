import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('package-lock.json')) {
  console.error('Release verification requires a genuine package-lock.json from npm install.');
  process.exit(2);
}
const commands = [
  ['npm', ['ci','--no-fund']],
  ['npm', ['run','verify']],
  ['npm', ['run','test:kit']],
  ['npm', ['audit','--audit-level=high']],
];
for (const [cmd,args] of commands) {
  const result=spawnSync(cmd,args,{stdio:'inherit',shell:process.platform==='win32'});
  if(result.status!==0) process.exit(result.status??1);
}
