import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import ts from 'typescript';
import { chartKinds, chartSnippet } from '../.test-build/src/demo/chart-examples.js';

const expected={line:'SeriesChart',area:'SeriesChart',hbar:'BarChart',vbar:'VerticalBarChart',grouped:'GroupedBarChart',stacked:'StackedBarChart',waterfall:'WaterfallChart',donut:'DonutChart',bullet:'BulletChart'};
for(const kind of chartKinds) {
  test(`${kind} example imports and renders the selected chart`,()=>{
    const code=chartSnippet(kind,'en');
    assert.match(code,new RegExp(`import \\{ ${expected[kind]} \\}`));
    assert.match(code,new RegExp(`<${expected[kind]}\\s`));
    assert.match(code,/export default function Example/);
    if(kind==='area')assert.match(code,/points=\{points\} area/);
    if(kind==='waterfall')assert.match(code,/start=\{184\} changes=\{changes\}/);
    if(kind==='bullet'){assert.match(code,/actual=\{97.3\} target=\{98\}/);assert.ok(code.includes("unit={{kind:'number',label:'%'}}"));}
  });
}

test('all 18 English/Korean chart snippets compile as complete TSX modules',async()=>{
  const dir='.test-build/snippet-check';
  await mkdir(dir,{recursive:true});
  const files=[];
  for(const kind of chartKinds)for(const locale of ['en','ko']) {
    const path=`${dir}/${kind}-${locale}.tsx`;
    await writeFile(path,chartSnippet(kind,locale).replaceAll("'./kit/","'../../src/kit/"));
    files.push(path);
  }
  const program=ts.createProgram(files,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.React,strict:true,noEmit:true,skipLibCheck:true,esModuleInterop:true});
  const diagnostics=ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}));
});

import { metricSnippet, tableSnippet, dashboardSnippet, stateSnippet } from '../.test-build/src/demo/example-code.js';
import { buildDashboard, dashboardMeta, INITIAL_RANGE } from '../.test-build/src/demo/dashboard-data.js';

test('table snippets serialize display amounts instead of leaking cents under USD labels',()=>{
  const model=buildDashboard('revenue',INITIAL_RANGE,'en');
  const code=tableSnippet(model,'en');
  const raw=model.rows[0].values.netSalesCents;
  assert.ok(code.includes(`"netSalesCents": ${raw/100}`));
  assert.ok(!code.includes(`"netSalesCents": ${raw},`));
});

test('dashboard, metric, table and state snippets compile for both locales and empty/invalid ranges',async()=>{
  const dir='.test-build/composed-snippet-check';
  await mkdir(dir,{recursive:true});
  const files=[];
  for(const locale of ['en','ko']) {
    const model=buildDashboard('revenue',INITIAL_RANGE,locale);
    const sources=[tableSnippet(model,locale),stateSnippet(locale)];
    for(const meta of dashboardMeta(locale))sources.push(dashboardSnippet(buildDashboard(meta.kind,INITIAL_RANGE,locale),meta,locale));
    for(const pattern of ['number','comparison','sparkline','target','status','compact'])sources.push(metricSnippet(model.metrics[0],pattern,locale,model.trend.map(p=>({...p,value:p.value===null?null:Math.round(p.value*100)}))));
    for(const range of [{start:'',end:''},{start:'2030-01-01',end:'2030-01-07'}])sources.push(dashboardSnippet(buildDashboard('revenue',range,locale),dashboardMeta(locale)[0],locale));
    for(const [i,code] of sources.entries()) {
      const path=`${dir}/${locale}-${i}.tsx`;await writeFile(path,code.replaceAll("'./kit/","'../../src/kit/"));files.push(path);
    }
  }
  const program=ts.createProgram(files,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.React,strict:true,noEmit:true,skipLibCheck:true,esModuleInterop:true});
  const diagnostics=ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}));
});
