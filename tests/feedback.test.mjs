import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import {
  AsyncState, ErrorPage, Skeleton, getStateContent,
} from '../.test-build/src/kit/ui/feedback.js';
import { StatePanel } from '../.test-build/src/kit/ui/primitives.js';
import { StateStudio, StateDemoView } from '../.test-build/src/demo/StateStudio.js';
import {
  stateKinds, stateDataKinds, statePageKinds, stateExamples, stateSnippet,
  createStateDemo, stateDemoReducer, stateDemoRows, stateDemoSnapshot, canRetryState,
} from '../.test-build/src/demo/state-examples.js';

const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const transition = (state, ...events) => events.reduce(stateDemoReducer, state);
const view = (model, locale = 'en') => render(StateDemoView, { model, locale, onEvent() {} });

test('registry has eleven distinct selected states, grouped into data and page examples', () => {
  assert.deepEqual(stateDataKinds, ['loading', 'empty', 'no-results', 'error', 'offline', 'stale', 'partial']);
  assert.deepEqual(statePageKinds, ['403', '404', '500', 'maintenance']);
  assert.equal(new Set(stateKinds).size, 11);
  for (const locale of ['en', 'ko']) {
    const registry = stateExamples(locale);
    assert.deepEqual(registry.map(item => item.id), stateKinds);
    assert.equal(registry.filter(item => item.group === 'data').length, 7);
    assert.equal(registry.filter(item => item.group === 'page').length, 4);
    assert.ok(registry.every(item => item.label.length > 2 && item.description.length > 10));
  }
  assert.notDeepEqual(stateExamples('en'), stateExamples('ko'));
});

for (const locale of ['en', 'ko']) {
  for (const kind of stateKinds) {
    test(`${kind} studio SSR selects one ${locale} example with honest local-demo copy`, () => {
      const html = render(StateStudio, { kind, locale });
      assert.match(html, new RegExp(`data-demo-origin="${kind}" data-demo-phase="${kind}"`));
      assert.equal((html.match(/data-state="/g) ?? []).length, 1);
      assert.ok(html.includes(getStateContent(kind, locale).title));
      assert.ok(html.includes(locale === 'en' ? 'LOCAL SIMULATION' : '로컬 시뮬레이션'));
      assert.ok(html.includes(locale === 'en' ? 'Reset example' : '예제 초기화'));
      assert.doesNotMatch(html, /NaN|Infinity|undefined/);
      if (statePageKinds.includes(kind)) assert.match(html, /kk-error-page/);
    });
  }
}

test('standalone primitives have localized semantics and never fabricate action callbacks', () => {
  for (const locale of ['en', 'ko']) {
    for (const kind of stateDataKinds) {
      const html = render(AsyncState, { kind, locale });
      assert.ok(html.includes(getStateContent(kind, locale).title));
      assert.doesNotMatch(html, /<button/);
      assert.match(html, kind === 'error' ? /role="alert"/ : /role="status"/);
    }
    for (const kind of statePageKinds) {
      const html = render(ErrorPage, { kind, locale });
      assert.ok(html.includes(getStateContent(kind, locale).title));
      assert.match(html, /<h1 id=/);
      assert.doesNotMatch(html, /<main|<button/);
    }
  }
});

test('loading reserves space without presenting an invented zero and skeleton respects accessibility', () => {
  const html = render(AsyncState, { kind: 'loading' });
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /kk-skeleton--table/);
  assert.match(html, /aria-hidden="true"/);
  assert.doesNotMatch(html, /<dd>0<\/dd>|0 requests/);
  const skeleton = render(Skeleton, { lines: 100, label: 'Loading report' });
  assert.equal((skeleton.match(/kk-skeleton-line/g) ?? []).length, 12);
  assert.match(skeleton, /role="status" aria-label="Loading report"/);
  assert.equal((render(Skeleton, { lines: NaN }).match(/kk-skeleton-line/g) ?? []).length, 3);
});

test('retained data is outside the announcement region and actions are ordinary type=button controls', () => {
  const html = render(AsyncState, {
    kind: 'partial', children: React.createElement('p', null, 'Saved evidence: 128 requests'),
    actions: [{ label: 'Retry sample', onAction() {}, variant: 'primary' }],
  });
  assert.match(html, /kk-feedback-data" aria-busy="false"><p>Saved evidence: 128 requests/);
  assert.match(html, /<button type="button"[^>]*>Retry sample<\/button>/);
  assert.ok(html.indexOf('Saved evidence') > html.indexOf('kk-feedback-data'));
});

test('existing StatePanel API and legacy kind remain unchanged', () => {
  const html = render(StatePanel, { title: 'Old title', message: 'Old message', kind: 'partial', action: React.createElement('button', null, 'Old action') });
  assert.match(html, /kk-state--partial/);
  assert.match(html, /Old title/);
  assert.match(html, /Old message/);
  assert.match(html, /Old action/);
});

for (const kind of ['error', 'offline', 'stale', 'partial', '500', 'maintenance']) {
  test(`${kind} retry succeeds only after a manually completed request`, () => {
    const initial = createStateDemo(kind);
    const pending = stateDemoReducer(initial, { type: 'retry' });
    assert.equal(pending.phase, 'loading');
    assert.equal(pending.attempts, 1);
    assert.equal(pending.pendingKind, kind);
    assert.deepEqual(stateDemoRows(pending), stateDemoRows(initial));
    assert.strictEqual(stateDemoReducer(pending, { type: 'retry' }), pending, 'double retry cannot start another pending request');
    const success = stateDemoReducer(pending, { type: 'complete' });
    assert.equal(success.phase, 'ready');
    assert.equal(success.pendingKind, null);
    assert.equal(stateDemoRows(success).length, 3);
    assert.equal(stateDemoSnapshot(success), '2026-09-30 09:00 UTC');
    assert.match(view(success), /Sample data ready/);
  });

  test(`${kind} re-failure retains its original meaning and supports retry again`, () => {
    const initial = createStateDemo(kind);
    const failed = transition(initial, { type: 'outcome', outcome: 'failure' }, { type: 'retry' }, { type: 'complete' });
    assert.equal(failed.phase, kind);
    assert.equal(failed.attempts, 1);
    assert.deepEqual(stateDemoRows(failed), stateDemoRows(initial));
    assert.match(view(failed), /Simulated request failed again/);
    const failedAgain = transition(failed, { type: 'retry' }, { type: 'complete' });
    assert.equal(failedAgain.attempts, 2);
    assert.equal(failedAgain.phase, kind);
    assert.deepEqual(stateDemoReducer(failedAgain, { type: 'reset' }), initial);
  });
}

test('stale and partial source evidence survives pending and failed refresh without zero substitution', () => {
  for (const kind of ['stale', 'partial']) {
    const initial = createStateDemo(kind);
    const pending = transition(initial, { type: 'outcome', outcome: 'failure' }, { type: 'retry' });
    const failed = stateDemoReducer(pending, { type: 'complete' });
    for (const model of [initial, pending, failed]) {
      assert.equal(stateDemoSnapshot(model), stateDemoSnapshot(initial));
      const html = view(model);
      assert.match(html, /Requests by region/);
      assert.ok(html.includes(stateDemoSnapshot(initial)));
      if (kind === 'partial') {
        assert.equal(stateDemoRows(model)[2].value, null);
        assert.match(html, /data-region="central" data-missing="true"/);
        assert.match(html, /Unavailable, not zero/);
        assert.match(html, /2 of 3 regions/);
        assert.match(html, /complete total withheld/);
      } else assert.match(html, /121/);
    }
  }
});

test('initial loading can complete or fail; repeated completion is inert', () => {
  const initial = createStateDemo('loading');
  assert.equal(stateDemoRows(initial).length, 0);
  assert.match(view(initial), /Complete simulated request/);
  const failed = transition(initial, { type: 'outcome', outcome: 'failure' }, { type: 'complete' });
  assert.equal(failed.phase, 'error');
  assert.strictEqual(stateDemoReducer(failed, { type: 'complete' }), failed);
  assert.equal(stateDemoReducer(initial, { type: 'complete' }).phase, 'ready');
});

test('empty source and no-results do not collapse into one meaning', () => {
  const empty = createStateDemo('empty');
  const filtered = createStateDemo('no-results');
  assert.equal(stateDemoRows(empty).length, 0);
  assert.equal(stateDemoRows(filtered).length, 0);
  assert.match(view(empty), /0 records in this scope/);
  assert.match(view(filtered), /3 available \/ 0 matching/);
  assert.strictEqual(stateDemoReducer(empty, { type: 'clear-filters' }), empty);
  const clear = stateDemoReducer(filtered, { type: 'clear-filters' });
  assert.equal(clear.phase, 'ready');
  assert.equal(clear.query, '');
  assert.equal(stateDemoRows(clear).length, 3);
  assert.match(view(clear), /3 of 3 match/);
  const pending = stateDemoReducer(empty, { type: 'load-sample' });
  assert.equal(pending.phase, 'loading');
  assert.equal(stateDemoRows(pending).length, 0);
  assert.equal(stateDemoReducer(pending, { type: 'complete' }).phase, 'ready');
});

test('search uses actual sample-row filtering in both languages and reset restores the selected no-results case', () => {
  const initial = createStateDemo('no-results');
  for (const query of ['East', ' EAST ', '동부']) {
    const result = stateDemoReducer(initial, { type: 'query', query });
    assert.equal(result.phase, 'ready');
    assert.deepEqual(stateDemoRows(result).map(row => row.id), ['east']);
    assert.deepEqual(stateDemoReducer(result, { type: 'reset' }), initial);
  }
  const noMatch = stateDemoReducer(initial, { type: 'query', query: 'does-not-exist' });
  assert.equal(noMatch.phase, 'no-results');
  assert.deepEqual(stateDemoRows(noMatch), []);
});

test('403 never gains access through retry, completion, search, or local back', () => {
  const initial = createStateDemo('403');
  assert.equal(canRetryState(initial.phase), false);
  for (const event of [{ type: 'retry' }, { type: 'complete' }, { type: 'query', query: '' }, { type: 'load-sample' }, { type: 'clear-filters' }]) {
    assert.strictEqual(stateDemoReducer(initial, event), initial);
  }
  const html = view(initial);
  assert.match(html, /You do not have access/);
  assert.match(html, /Retrying does not grant permission/);
  assert.match(html, /Simulate going back/);
  assert.doesNotMatch(html, /Simulate retry|Simulated result|Requests by region/);
  const returned = stateDemoReducer(initial, { type: 'back' });
  assert.equal(returned.phase, 'returned');
  assert.deepEqual(stateDemoRows(returned), []);
  assert.match(view(returned), /restricted resource remains inaccessible/);
  assert.equal(stateDemoReducer(returned, { type: 'reset' }).phase, '403');
});

test('500 is a retryable server failure, distinct from denied access and an empty dataset', () => {
  const initial = createStateDemo('500');
  const html = view(initial);
  assert.match(html, /server could not complete this request/);
  assert.match(html, /Simulate retry/);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /You do not have access|No data yet|Requests by region/);
  const failed = transition(initial, { type: 'outcome', outcome: 'failure' }, { type: 'retry' }, { type: 'complete' });
  assert.equal(failed.phase, '500');
  assert.match(view(failed, 'ko'), /서버가 이 요청을 완료하지 못했습니다/);
  assert.deepEqual(stateDemoRows(failed), []);
});

test('local back interrupts a pending page request; stale completion cannot reopen it', () => {
  const pending = stateDemoReducer(createStateDemo('500'), { type: 'retry' });
  const returned = stateDemoReducer(pending, { type: 'back' });
  assert.equal(returned.phase, 'returned');
  assert.strictEqual(stateDemoReducer(returned, { type: 'complete' }), returned);
  assert.equal(stateDemoReducer(returned, { type: 'reset' }).phase, '500');
});

test('feedback demos contain no network calls, timers, implicit navigation or CSS imports in TSX', async () => {
  for (const path of ['src/kit/ui/feedback.tsx', 'src/demo/StateStudio.tsx']) {
    const source = await readFile(path, 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|setTimeout\s*\(|setInterval\s*\(|location\.(?:assign|replace)|history\.(?:back|go)|import\s+['"][^'"]+\.css['"]/);
  }
  const css = await readFile('src/kit/ui/feedback.css', 'utf8');
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /max-width:600px/);
});

test('all twenty-two state snippets are complete independent TSX modules in English and Korean', async () => {
  const directory = '.test-build/feedback-snippet-check';
  await mkdir(directory, { recursive: true });
  const files = [];
  for (const locale of ['en', 'ko']) for (const kind of stateKinds) {
    const code = stateSnippet(kind, locale);
    assert.match(code, /export default function Example/);
    assert.match(code, /useReducer\(reduceExample, initialModel\)/);
    assert.ok(code.includes('\"origin\": \"' + kind + '\"'));
    assert.doesNotMatch(code, /from ['"][^'"]*demo|\bfetch\s*\(|setTimeout\s*\(/);
    assert.match(code, /if \(canRetry\(phase\)\)/);
    const path = `${directory}/${kind}-${locale}.tsx`;
    await writeFile(path, code.replaceAll("'./kit/", "'../../src/kit/"));
    files.push(path);
  }
  const program = ts.createProgram(files, {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.React, strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: file => file, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n',
  }));
});


test('every copied reducer and evidence helper matches the live studio through recovery, filtering, repeat and interruption', async () => {
  const sequences = [
    [{ type: 'retry' }, { type: 'retry' }, { type: 'complete' }, { type: 'complete' }, { type: 'reset' }],
    [{ type: 'outcome', outcome: 'failure' }, { type: 'retry' }, { type: 'complete' }, { type: 'retry' }, { type: 'complete' }, { type: 'outcome', outcome: 'success' }, { type: 'retry' }, { type: 'complete' }],
    [{ type: 'query', query: '동부' }, { type: 'query', query: 'West' }, { type: 'query', query: 'no-such-region' }, { type: 'clear-filters' }, { type: 'reset' }],
    [{ type: 'outcome', outcome: 'failure' }, { type: 'load-sample' }, { type: 'complete' }, { type: 'retry' }, { type: 'outcome', outcome: 'success' }, { type: 'complete' }],
    [{ type: 'retry' }, { type: 'back' }, { type: 'complete' }, { type: 'retry' }, { type: 'reset' }],
  ];
  for (const locale of ['en', 'ko']) for (const kind of stateKinds) {
    const prefix = stateSnippet(kind, locale).split('export default function Example()')[0].replace(/^import .*;$/gm, '');
    const javascript = ts.transpileModule(prefix, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    const snippet = await import('data:text/javascript;base64,' + Buffer.from(javascript).toString('base64'));
    for (const events of sequences) {
      let live = createStateDemo(kind), copied = snippet.initialModel;
      for (const event of events) {
        live = stateDemoReducer(live, event);
        copied = snippet.reduceExample(copied, event);
        assert.deepEqual(copied, live, `${locale}/${kind}/${event.type}`);
        assert.deepEqual(snippet.exampleRows(copied), stateDemoRows(live), `${locale}/${kind}/${event.type} evidence`);
      }
    }
  }
});
