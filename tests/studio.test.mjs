import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { isStudioSection, studioDefaults, studioExamples, studioSnippet, StudioPreview } from '../.test-build/src/demo/studio-catalog.js';
const sections=['navigation','controls','states','pages'];

test('studio inventory is bounded, selectable and separates data states from full error pages',()=>{
  assert.equal(isStudioSection('dashboard'),false);
  for(const section of sections) {
    assert.equal(isStudioSection(section),true);
    const examples=studioExamples(section,'en');
    assert.ok(examples.some(e=>e.id===studioDefaults[section]));
    assert.equal(new Set(examples.map(e=>e.id)).size,examples.length);
    assert.ok(examples.every(e=>e.label&&e.description));
    assert.deepEqual(examples.map(e=>e.id),studioExamples(section,'ko').map(e=>e.id));
  }
  assert.deepEqual(studioExamples('pages','en').map(e=>e.id),['403','404','500','maintenance']);
  assert.ok(studioExamples('states','en').some(e=>e.id==='no-results'));
});

for(const locale of ['en','ko'])for(const section of sections) {
  test(`${locale} ${section}: every selectable example renders without backend or credentials`,()=>{
    for(const example of studioExamples(section,locale)) {
      const html=renderToStaticMarkup(React.createElement(StudioPreview,{section,kind:example.id,locale}));
      assert.ok(html.length>100,`${section}/${example.id}`);
      assert.doesNotMatch(html,/NaN|undefined|Infinity/);
    }
  });
}

test('every selected studio Code example compiles as a standalone TSX module in both locales',async()=>{
  const dir='.test-build/studio-snippets';await mkdir(dir,{recursive:true});const files=[];
  for(const locale of ['en','ko'])for(const section of sections)for(const example of studioExamples(section,locale)) {
    const code=studioSnippet(section,example.id,locale);
    assert.match(code,/export default function/);
    assert.doesNotMatch(code,/from ['"][^'"]*(?:demo\/|StateStudio|ControlStudio|NavigationStudio)/);
    assert.ok(code.includes("./kit/"),`${section}/${example.id} must use the reusable kit`);
    const filename=`${dir}/${section}-${example.id}-${locale}.tsx`;
    await writeFile(filename,code.replaceAll("'./kit/","'../../src/kit/").replaceAll('"./kit/','"../../src/kit/'));
    files.push(filename);
  }
  const program=ts.createProgram(files,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.React,strict:true,noEmit:true,skipLibCheck:true,esModuleInterop:true});
  const diagnostics=ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length,0,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n'}));
});
