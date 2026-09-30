import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inlinePreview } from './preview-html.mjs';

// Portable offline preview from the actual production bundle. No hosted services,
// altered behavior, or hand-written imitation of the rendered application.
const root=resolve('dist');
let html=await readFile(resolve(root,'kit.html'),'utf8');
const script=html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
const stylesheet=html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
if(!script||!stylesheet)throw new Error('Build output structure changed; review the standalone bundling step.');
const assetPath=href=>resolve(root,href.replace(/^\.?\//,''));
const javascript=await readFile(assetPath(script[1]),'utf8');
const css=await readFile(assetPath(stylesheet[1]),'utf8');
html=inlinePreview(html,javascript,css);
const notices=await readFile(resolve(root,'LICENSES.txt'),'utf8');
html=html.replace('<head>',()=>`<head>\n<!--\n${notices.replaceAll('--','—')}\n-->`);
await mkdir('artifacts',{recursive:true});
for(const name of ['KPI-Kit-preview.html','standalone-preview.html'])await writeFile(`artifacts/${name}`,html);
console.log(`Standalone preview: artifacts/KPI-Kit-preview.html (${Buffer.byteLength(html)} bytes)`);
