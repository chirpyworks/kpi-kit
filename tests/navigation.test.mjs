import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdir, writeFile } from 'node:fs/promises';
import ts from 'typescript';
import {
  Breadcrumbs, DashboardShell, DetailPanel, getPaginationState, PageHeader, Pagination, SideNavigation,
} from '../.test-build/src/kit/ui/navigation.js';
import { NavigationStudio } from '../.test-build/src/demo/NavigationStudio.js';
import { navigationContent, navigationExamples, navigationKinds, navigationSnippet } from '../.test-build/src/demo/navigation-examples.js';

const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const noop = () => {};

test('breadcrumbs use native navigation and only mark the final location current', () => {
  const html = render(Breadcrumbs, { items: [
    { id: 'home', label: 'Workspace', href: '/workspace' },
    { id: 'reports', label: 'Reports', onClick: noop },
    { id: 'report', label: 'Revenue', href: '/revenue', onClick: noop },
  ] });
  assert.match(html, /^<nav[^>]*aria-label="Breadcrumbs"><ol>/);
  assert.match(html, /<a href="\/workspace">Workspace<\/a>/);
  assert.match(html, /<button type="button">Reports<\/button>/);
  assert.match(html, /<span aria-current="page">Revenue<\/span>/);
  assert.equal((html.match(/aria-current/g) ?? []).length, 1);
  assert.doesNotMatch(html, /href="\/revenue"/);
  assert.equal(render(Breadcrumbs, { items: [] }), '');
});

test('side navigation exposes its name, selected view, disabled items, and meaningful labels', () => {
  const html = render(SideNavigation, { label: 'Workspace views', value: 'reports', onValueChange: noop,
    items: [{ id: 'overview', label: 'Overview' }, { id: 'reports', label: 'Reports', badge: 0 }, { id: 'later', label: 'Later', disabled: true }],
  });
  assert.match(html, /<nav[^>]*aria-label="Workspace views"/);
  assert.match(html, /<button type="button" aria-current="page"><span>Reports<\/span>/);
  assert.match(html, /class="kk-side-navigation-badge">0</);
  assert.match(html, /<button type="button" disabled=""><span>Later<\/span>/);
  assert.equal((html.match(/aria-current/g) ?? []).length, 1);
});

test('page headers use caller-selected heading levels and preserve action slots', () => {
  const html = render(PageHeader, { title: 'Review queue', description: 'Pending reports', headingLevel: 2,
    eyebrow: 'Workspace', actions: React.createElement('button', null, 'Add report'),
  });
  assert.match(html, /<h2>Review queue<\/h2>/);
  assert.match(html, /Pending reports/);
  assert.match(html, /<button>Add report<\/button>/);
});

test('shell is a labelled embeddable region and does not introduce a nested main', () => {
  const html = render(DashboardShell, { label: 'Report workspace', navigation: 'Navigation', header: 'Header', children: 'Results', detail: 'Selected record', footer: 'Synthetic data' });
  assert.match(html, /^<section[^>]*aria-label="Report workspace"/);
  assert.match(html, /data-has-detail="true"/);
  for (const text of ['Navigation', 'Header', 'Results', 'Selected record', 'Synthetic data']) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /<main/);
});

test('detail panels are labelled non-modal asides with explicit close buttons', () => {
  const props = { open: true, onClose: noop, title: 'Selected report', description: 'Supporting detail', children: 'The selected record', footer: 'Synthetic data' };
  const html = render(DetailPanel, props);
  assert.match(html, /^<aside[^>]*aria-labelledby="[^"]+"/);
  assert.match(html, /aria-label="Close detail panel"/);
  assert.match(html, /<h3 id="[^"]+">Selected report<\/h3>/);
  assert.doesNotMatch(html, /role="dialog"|aria-modal|<dialog/);
  assert.equal(render(DetailPanel, { ...props, open: false }), '');
  assert.match(render(DetailPanel, { ...props, locale: 'ko' }), /aria-label="상세 패널 닫기"/);
});

test('pagination safely clamps stale, negative, fractional, and non-finite page numbers', () => {
  const base = { pageSize: 5, totalItems: 23 };
  assert.deepEqual(getPaginationState({ ...base, page: 99 }), { page: 5, pageSize: 5, totalItems: 23, totalPages: 5, startIndex: 20, endIndex: 23, from: 21, to: 23, hasPrevious: true, hasNext: false });
  for (const page of [-4, 0, NaN, Infinity, -Infinity]) assert.equal(getPaginationState({ ...base, page }).page, 1);
  assert.equal(getPaginationState({ ...base, page: 2.7 }).page, 2);
  assert.equal(getPaginationState({ ...base, page: 4, totalItems: 3 }).page, 1);
});

test('pagination slices cover every result exactly once, with no out-of-bounds rows', () => {
  for (const totalItems of [0, 1, 4, 5, 6, 23, 101]) {
    for (const pageSize of [1, 5, 10, 30]) {
      const results = Array.from({ length: totalItems }, (_, i) => i);
      const observed = [];
      const totalPages = getPaginationState({ page: 1, pageSize, totalItems }).totalPages;
      for (let page = 1; page <= totalPages; page++) {
        const state = getPaginationState({ page, pageSize, totalItems });
        assert.ok(state.startIndex >= 0 && state.endIndex <= totalItems);
        observed.push(...results.slice(state.startIndex, state.endIndex));
      }
      assert.deepEqual(observed, results);
    }
  }
});

test('pagination rejects invalid counts and sizes rather than producing misleading ranges', () => {
  for (const pageSize of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => getPaginationState({ page: 1, pageSize, totalItems: 20 }), RangeError);
  for (const totalItems of [-1, 1.5, NaN, Infinity]) assert.throws(() => getPaginationState({ page: 1, pageSize: 5, totalItems }), RangeError);
});

test('pagination disables boundary actions and explicitly handles zero results', () => {
  const first = render(Pagination, { page: 1, pageSize: 5, totalItems: 23, onPageChange: noop });
  assert.match(first, /disabled=""[^>]*aria-label="Previous page"/);
  assert.match(first, /aria-current="page"/);
  assert.match(first, /1–5 of 23 results/);
  const last = render(Pagination, { page: 50, pageSize: 5, totalItems: 23, onPageChange: noop });
  assert.match(last, /disabled=""[^>]*aria-label="Next page"/);
  assert.match(last, /21–23 of 23 results/);
  const empty = render(Pagination, { page: 1, pageSize: 5, totalItems: 0, onPageChange: noop });
  assert.match(empty, /0–0 of 0 results/);
  assert.equal((empty.match(/disabled=""/g) ?? []).length, 2);
  assert.doesNotMatch(empty, /aria-current/);
});

test('large page counts keep controls bounded while offering first and last pages', () => {
  const html = render(Pagination, { page: 500, pageSize: 5, totalItems: 5000, onPageChange: noop });
  assert.ok((html.match(/<button/g) ?? []).length <= 9);
  assert.match(html, /aria-label="Page 1"/);
  assert.match(html, /aria-label="Page 1000"/);
  assert.match(html, /aria-label="Page 500" aria-current="page"/);
});

for (const locale of ['en', 'ko']) {
  test(`all five ${locale} navigation examples are independent and correctly labelled`, () => {
    const meta = navigationExamples(locale);
    assert.deepEqual(meta.map(item => item.id), navigationKinds);
    for (const kind of navigationKinds) {
      const html = render(NavigationStudio, { kind, locale });
      assert.ok(html.includes('kk-navigation-example'));
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
      const references = [...html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)].flatMap(match => match[1].split(' '));
      assert.equal(ids.length, new Set(ids).size);
      assert.ok(references.every(ref => ids.includes(ref)), `${kind} has no broken accessibility references`);
      assert.ok(meta.find(item => item.id === kind).description.length > 10);
    }
    const data = navigationContent(locale);
    assert.match(render(NavigationStudio, { kind: 'tabs', locale }), /role="tablist"/);
    assert.ok(render(NavigationStudio, { kind: 'tabs', locale }).includes(data.tabs.items[0].title));
    assert.ok(!render(NavigationStudio, { kind: 'tabs', locale }).includes(data.tabs.items[1].title));
    const pages = render(NavigationStudio, { kind: 'pagination', locale });
    assert.ok(pages.includes(data.pagination.rows[0].title));
    assert.ok(pages.includes(data.pagination.rows[4].title));
    assert.ok(!pages.includes(data.pagination.rows[5].title));
    assert.ok(render(NavigationStudio, { kind: 'shell', locale }).includes(data.shell.views[0].description));
  });
}

test('all ten navigation snippets compile as standalone localized TSX modules', async () => {
  const dir = '.test-build/navigation-snippet-check';
  await mkdir(dir, { recursive: true });
  const files = [];
  for (const kind of navigationKinds) for (const locale of ['en', 'ko']) {
    const code = navigationSnippet(kind, locale);
    assert.match(code, /export default function Example/);
    assert.match(code, /className="kk-root kk-navigation-example"/);
    assert.doesNotMatch(code, /src\/demo|NavigationStudio|navigationContent/);
    if (kind === 'detail') assert.match(code, /triggers.current\[selected\]\?\.focus\(\)/);
    if (kind === 'pagination') assert.match(code, /copy.rows.slice\(state.startIndex, state.endIndex\)/);
    const path = `${dir}/${kind}-${locale}.tsx`;
    await writeFile(path, code.replaceAll("'./kit/", "'../../src/kit/"));
    files.push(path);
  }
  const program = ts.createProgram(files, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.React, strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: file => file, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' }));
});

function elements(root) {
  if (!React.isValidElement(root)) return [];
  return [root, ...React.Children.toArray(root.props.children).flatMap(elements)];
}

test('controlled navigation forwards the chosen item instead of a fixed destination', () => {
  let chosen;
  const tree = SideNavigation({ label: 'Views', value: 'overview', items: [{ id: 'overview', label: 'Overview' }, { id: 'reports', label: 'Reports' }], onValueChange: value => { chosen = value; } });
  const buttons = elements(tree).filter(element => element.type === 'button');
  buttons[1].props.onClick();
  assert.equal(chosen, 'reports');
  buttons[0].props.onClick();
  assert.equal(chosen, 'overview');
});

test('pagination actions request the matching page and clamp callbacks at both boundaries', () => {
  let requested;
  const tree = Pagination({ page: 3, pageSize: 5, totalItems: 23, onPageChange: value => { requested = value; } });
  const control = label => elements(tree).find(element => element.props['aria-label'] === label);
  control('Next page').props.onClick();
  assert.equal(requested, 4);
  control('Previous page').props.onClick();
  assert.equal(requested, 2);
  control('Page 5').props.onClick();
  assert.equal(requested, 5);
  for (const [page, label, expected] of [[1, 'Previous page', 1], [5, 'Next page', 5]]) {
    const edge = Pagination({ page, pageSize: 5, totalItems: 23, onPageChange: value => { requested = value; } });
    const button = elements(edge).find(element => element.props['aria-label'] === label);
    assert.equal(button.props.disabled, true);
    button.props.onClick();
    assert.equal(requested, expected);
  }
});

test('breadcrumb URLs allow HTTP(S), relative paths, queries and fragments without rewriting them', () => {
  for (const href of [
    'https://example.com/reports', 'HTTP://example.com:8080/reports?view=all#rows',
    'https://예시.한국/리포트', '//example.com/reports', '/reports', 'reports/weekly',
    './reports', '../reports', '?view=all&sort=date', '#details', '/reports?q=year%20end',
    './javascript:literal-path', '/reports?return=javascript:literal-query', '#javascript:literal-fragment',
  ]) {
    const html = render(Breadcrumbs, { items: [{ id: 'link', label: 'Reports', href }, { id: 'current', label: 'Current' }] });
    assert.equal((html.match(/<a /g) ?? []).length, 1, href);
    assert.ok(html.includes(`href="${href.replaceAll('&', '&amp;')}"`), href);
  }
});

test('breadcrumb URLs reject executable and unsupported schemes, including obscured prefixes', () => {
  for (const href of [
    'javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'javascript:alert(1) ',
    '\tjavascript:alert(1)', 'java\nscript:alert(1)', 'java\rscript:alert(1)', 'java\tscript:alert(1)',
    '\u0000javascript:alert(1)', '\u00a0javascript:alert(1)', 'java script:alert(1)',
    '%6aavascript:alert(1)', '%6a%61vascript%3Aalert(1)', 'java%09script%3aalert(1)',
    'javascript&#58;alert(1)', 'javascript&#x3a;alert(1)', 'javascript&colon;alert(1)',
    'java&Tab;script&colon;alert(1)', 'javascript%26%23x3a;alert(1)',
    'data:text/html,<script>alert(1)</script>', 'DATA:text/plain,test', 'vbscript:msgbox(1)',
    'file:///etc/passwd', 'ftp://example.com/file', 'blob:https://example.com/id',
    'mailto:person@example.com', 'tel:+123', 'custom+app:route', 'app:route',
    '\\reports', '/reports\\weekly', 'https:\\example.com', 'https://example.com/a\\b',
    'https://', 'http://[invalid', '%invalid',
  ]) {
    const html = render(Breadcrumbs, { items: [{ id: 'unsafe', label: 'Unsafe', href, onClick: noop }, { id: 'current', label: 'Current' }] });
    assert.doesNotMatch(html, /<a\b|<button\b|\shref=/, href);
    assert.match(html, /<span>Unsafe<\/span>/, href);
    assert.match(html, /aria-current="page">Current/, href);
  }
});

test('breadcrumb URL guard rejects every raw C0/C1 control and DEL, including within HTTP URLs', () => {
  const codes = [...Array.from({ length: 32 }, (_, i) => i), ...Array.from({ length: 33 }, (_, i) => 127 + i)];
  for (const code of codes)for (const href of [`java${String.fromCharCode(code)}script:alert(1)`, `https://example.com/a${String.fromCharCode(code)}b`]) {
    const html = render(Breadcrumbs, { items: [{ id: 'unsafe', label: 'Unsafe', href }, { id: 'current', label: 'Current' }] });
    assert.doesNotMatch(html, /<a\b|\shref=/, `control U+${code.toString(16)}`);
  }
});

test('unsafe breadcrumb URLs never fall back to caller actions; valid local callbacks remain usable', () => {
  const elements = node => !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(elements)];
  let calls = 0;
  const onClick = () => { calls += 1; };
  const unsafe = Breadcrumbs({ items: [{ id: 'unsafe', label: 'Unsafe', href: 'javascript:alert(1)', onClick }, { id: 'current', label: 'Current' }] });
  assert.equal(elements(unsafe).filter(element => element.props.onClick).length, 0);
  for (const href of [undefined, '', '/reports']) {
    const safe = Breadcrumbs({ items: [{ id: 'safe', label: 'Safe', href, onClick }, { id: 'current', label: 'Current' }] });
    const action = elements(safe).find(element => element.props.onClick);
    assert.ok(action);
    action.props.onClick();
  }
  assert.equal(calls, 3);
});

test('unexpected URL types fail closed and current-location URLs remain non-interactive', () => {
  for (const href of [null, 123, {}, ['javascript:alert(1)']]) {
    const html = render(Breadcrumbs, { items: [{ id: 'unsafe', label: 'Unsafe', href, onClick: noop }, { id: 'current', label: 'Current' }] });
    assert.doesNotMatch(html, /<a\b|<button\b|\shref=/);
  }
  const html = render(Breadcrumbs, { items: [{ id: 'current', label: 'Current', href: 'javascript:alert(1)', onClick: noop }] });
  assert.match(html, /aria-current="page">Current/);
  assert.doesNotMatch(html, /<a\b|<button\b|\shref=/);
});
