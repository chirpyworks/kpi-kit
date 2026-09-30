import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { assertResponsiveViewport, inlinePreview } from '../scripts/preview-html.mjs';

const viewport = '<meta name="viewport" content="width=device-width,initial-scale=1"/>';
const document = head => `<!doctype html><html><head>${head}<script type="module" crossorigin src="./assets/main.js"></script><link rel="stylesheet" crossorigin href="./assets/main.css"></head><body><div id="root"></div></body></html>`;

test('both workbench entry points declare one zoomable device viewport before scripts', async () => {
  for (const file of ['index.html', 'kit.html']) {
    const html = await readFile(file, 'utf8');
    assert.doesNotThrow(() => assertResponsiveViewport(html));
    assert.ok(html.indexOf('name="viewport"') < html.indexOf('<script'));
  }
});

test('standalone bundling preserves the viewport and has no external runtime assets', () => {
  const output = inlinePreview(document(viewport), 'console.log("</script>")', 'body{margin:0}');
  assert.doesNotThrow(() => assertResponsiveViewport(output));
  assert.equal(output.match(/name="viewport"/g)?.length, 1);
  assert.ok(output.includes(viewport));
  assert.ok(output.includes('<style>body{margin:0}</style>'));
  assert.ok(output.includes('<\\/script>'));
  assert.doesNotMatch(output, /(?:src|href)="\.\/assets\//);
});

test('preview build rejects missing, duplicate or body-only viewport metadata', () => {
  for (const html of [document(''), document(viewport + viewport), document('').replace('<div', `${viewport}<div`)]) {
    assert.throws(() => inlinePreview(html, '', ''), /exactly one viewport/);
  }
});

test('preview build rejects a fixed desktop width and preserves pinch zoom', () => {
  for (const content of ['width=980,initial-scale=1', 'width=device-width', 'width=device-width,initial-scale=1,maximum-scale=1', 'width=device-width,initial-scale=1,user-scalable=no']) {
    assert.throws(() => assertResponsiveViewport(document(`<meta name="viewport" content="${content}">`)));
  }
});

test('compact shell source covers 360/390 and the observed 980px layout without changing desktop 1280px', async () => {
  const css = await readFile('src/demo/explorer.css', 'utf8');
  const breakpoint = Number(css.match(/@media\(max-width:(\d+)px\)\{html,body,#root/)?.[1]);
  assert.ok([360, 390, 768, 980, 1100].every(width => width <= breakpoint));
  assert.ok([1101, 1280, 1440].every(width => width > breakpoint));
  assert.match(css, /\.kk-demo\[data-mobile-panel=library\] \.demo-library\{display:flex\}/);
  assert.match(css, /\.kk-demo\[data-mobile-panel=preview\] \.demo-preview\{display:block\}/);
  assert.match(css, /\.kk-demo\[data-mobile-panel=inspect\] \.demo-inspector\{display:block\}/);
  assert.match(css, /\.demo-workspace\[data-inspector-open=true\]>\.demo-inspector\{display:none;position:static/);
});

 test('build and portable preview retain full project and runtime license notices', async () => {
  const build = await readFile('scripts/stamp-build.mjs', 'utf8');
  const preview = await readFile('scripts/create-preview.mjs', 'utf8');
  assert.match(build, /\['react', 'react-dom', 'scheduler'\]/);
  assert.match(build, /node_modules\/\$\{name\}\/LICENSE/);
  assert.match(build, /dist\/LICENSES.txt/);
  assert.match(build, /dist\/LICENSE/);
  assert.match(preview, /readFile\(resolve\(root,'LICENSES.txt'\)/);
  assert.match(preview, /notices.replaceAll/);
});
