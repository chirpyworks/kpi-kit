import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const output = process.env.KPI_CONTROL_TEST_OUTDIR || '.test-build';
const compiled = file => import(pathToFileURL(resolve(output, 'src', file)).href);
const {
  controlKinds, controlExamples, controlCopy, controlSnippet, controlData, initialFormState, sampleFormValues,
  validateReportForm, transitionReportForm, filterReports, sampleReports, defaultReportFilters,
  initialConfirmationState, transitionConfirmation, transitionNotification,
} = await compiled('demo/control-examples.js');
const { ControlStudio } = await compiled('demo/ControlStudio.js');
const { InputField, SelectField, ConfirmDialog, Notification } = await compiled('kit/ui/controls.js');
const { Button, Dialog } = await compiled('kit/ui/primitives.js');
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));
function descendants(node, type) {
  if (!React.isValidElement(node)) return [];
  return [...(node.type === type ? [node] : []), ...React.Children.toArray(node.props.children).flatMap(child => descendants(child, type))];
}

test('six independently selectable controls expose localized metadata and memory-only contracts', () => {
  assert.deepEqual(controlKinds, ['form', 'filters', 'dialog', 'confirm', 'notification', 'tooltip']);
  for (const locale of ['en', 'ko']) {
    assert.equal(controlExamples(locale).length, 6);
    for (const kind of controlKinds) {
      const item = controlExamples(locale).find(example => example.id === kind);
      assert.ok(item.label && item.description);
      assert.equal(controlData(kind, locale).persistence, 'memory-only');
      assert.equal(controlData(kind, locale).backend, null);
    }
  }
});

test('form validation rejects empty, whitespace, short, oversized and invalid numeric values in both locales', () => {
  for (const locale of ['en', 'ko']) {
    for (const name of ['', '   ', 'ab', 'x'.repeat(65)]) assert.ok(validateReportForm({ ...sampleFormValues(), name }, locale).name);
    for (const target of ['', '0', '-1', '1.5', '100001', 'Infinity', 'NaN', '1e3', '2,500', 'abc']) assert.ok(validateReportForm({ ...sampleFormValues(), target }, locale).target, target);
    for (const target of ['1', '100000', ' 2500 ']) assert.equal(validateReportForm({ ...sampleFormValues(), target }, locale).target, undefined);
    assert.ok(validateReportForm({ ...sampleFormValues(), cadence: 'invalid' }, locale).cadence);
    assert.deepEqual(validateReportForm(sampleFormValues(), locale), {});
  }
});

test('form transitions block invalid submission, save a normalized local snapshot, and update validation on edit', () => {
  for (const locale of ['en', 'ko']) {
    const initial = initialFormState();
    const invalid = transitionReportForm(initial, { type: 'submit' }, locale);
    assert.equal(invalid.saved, null);
    assert.equal(invalid.submitted, true);
    assert.ok(invalid.errors.name);
    assert.deepEqual(initial, initialFormState());
    const filled = transitionReportForm(invalid, { type: 'fill' }, locale);
    assert.equal(filled.values.name, controlCopy(locale).namePlaceholder);
    const changed = transitionReportForm(filled, { type: 'change', values: { name: '  Growth overview  ', target: '02500', comparison: false, alerts: true } }, locale);
    const saved = transitionReportForm(changed, { type: 'submit' }, locale);
    assert.deepEqual(saved.errors, {});
    assert.equal(saved.saved.name, 'Growth overview');
    assert.equal(saved.saved.target, '2500');
    assert.equal(saved.saved.comparison, false);
    assert.equal(saved.saved.alerts, true);
    assert.notEqual(saved.values, saved.saved);
    const edited = transitionReportForm(saved, { type: 'change', values: { target: '0' } }, locale);
    assert.ok(edited.errors.target);
    assert.deepEqual(edited.saved, saved.saved);
    assert.equal(edited.noticeVisible, false);
    assert.equal(saved.noticeVisible, true);
    const dismissed = transitionReportForm(saved, { type: 'dismiss' }, locale);
    assert.deepEqual(dismissed.saved, saved.saved);
    assert.deepEqual(dismissed.values, saved.values);
    assert.equal(dismissed.noticeVisible, false);
  }
});

test('combined search, category and status filters produce local results and an honest no-results state', () => {
  for (const locale of ['en', 'ko']) {
    const rows = sampleReports(locale);
    assert.equal(filterReports(rows, defaultReportFilters).length, 4);
    assert.equal(filterReports(rows, { query: '', category: 'revenue', status: 'watch' })[0].id, 'report-02');
    assert.equal(filterReports(rows, { query: locale === 'ko' ? '고객' : ' CUSTOMER ', category: 'all', status: 'healthy' })[0].id, 'report-03');
    assert.deepEqual(filterReports(rows, { query: 'no-such-report', category: 'all', status: 'all' }), []);
    assert.deepEqual(filterReports(rows, { query: '', category: 'customers', status: 'watch' }), []);
    assert.equal(rows.length, 4);
  }
});

test('confirmation cancel preserves filters; only an open confirmed action resets them', () => {
  const initial = initialConfirmationState();
  assert.equal(transitionConfirmation(initial, 'confirm'), initial);
  const open = transitionConfirmation(initial, 'open');
  assert.equal(open.open, true);
  const cancel = transitionConfirmation(open, 'cancel');
  assert.deepEqual(cancel.filters, initial.filters);
  assert.equal(cancel.open, false);
  assert.equal(cancel.outcome, 'cancelled');
  const confirmed = transitionConfirmation(transitionConfirmation(cancel, 'open'), 'confirm');
  assert.deepEqual(confirmed.filters, defaultReportFilters);
  assert.equal(confirmed.outcome, 'confirmed');
  assert.equal(filterReports(sampleReports('en'), confirmed.filters).length, 4);
  assert.equal(transitionConfirmation(confirmed, 'confirm'), confirmed);
  assert.deepEqual(transitionConfirmation(confirmed, 'restore'), initial);
});

test('confirmation component maps close and cancel to cancel only, and confirm to its explicit callback', () => {
  let cancelled = 0, confirmed = 0;
  const tree = ConfirmDialog({ open: true, title: 'Reset?', message: 'Reset local sample filters', onCancel: () => cancelled++, onConfirm: () => confirmed++, cancelLabel: 'Cancel', confirmLabel: 'Reset filters' });
  assert.equal(tree.type, Dialog);
  assert.equal(tree.props.closeLabel, 'Close');
  tree.props.onClose();
  assert.equal(cancelled, 1);
  assert.equal(confirmed, 0);
  const buttons = descendants(tree, Button);
  assert.equal(buttons[0].props.autoFocus, true);
  buttons[0].props.onClick();
  assert.equal(cancelled, 2);
  assert.equal(confirmed, 0);
  buttons[1].props.onClick();
  assert.equal(confirmed, 1);
});

test('notification dismissal is callback-driven, replayable and uses semantic announcement roles', () => {
  let visible = true;
  const tree = Notification({ title: 'Ready', message: 'Local preview', tone: 'success', dismissLabel: 'Dismiss notification', onDismiss: () => { visible = transitionNotification(visible, 'dismiss'); } });
  assert.equal(tree.props.role, 'status');
  assert.equal(tree.props['aria-atomic'], 'true');
  const dismiss = descendants(tree, Button)[0];
  assert.equal(dismiss.props['aria-label'], 'Dismiss notification');
  dismiss.props.onClick();
  assert.equal(visible, false);
  assert.equal(transitionNotification(visible, 'show'), true);
  assert.equal(Notification({ title: 'Failure', message: 'Try again', tone: 'error' }).props.role, 'alert');
  assert.equal(descendants(Notification({ title: 'Pinned', message: 'No dismiss handler' }), Button).length, 0);
});

test('input and select fields expose exact labels, linked hints and errors, and native control semantics', () => {
  for (const component of [InputField, SelectField]) {
    const props = { id: 'target', label: 'Signup target', hint: 'Whole number', error: 'Required', 'aria-describedby': 'external', value: '', onChange: () => {}, options: [{ value: '', label: 'Choose' }] };
    const html = render(component, props);
    assert.match(html, /aria-label="Signup target"/);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, /aria-describedby="external target-hint target-error"/);
    assert.match(html, /aria-errormessage="target-error"/);
    assert.match(html, /id="target-hint"/);
    assert.match(html, /id="target-error"/);
    if (component === SelectField) assert.match(html, /<select/);
    else assert.match(html, /<input/);
  }
});

for (const locale of ['en', 'ko']) for (const kind of controlKinds) {
  test(`${kind} SSR mounts only its selected interaction in ${locale}`, () => {
    const html = render(ControlStudio, { kind, locale }), c = controlCopy(locale);
    assert.equal((html.match(/data-control-kind=/g) || []).length, 1);
    assert.match(html, new RegExp(`data-control-kind="${kind}"`));
    const labels = { form: c.title, filters: c.filterTitle, dialog: c.dialogTitle, confirm: c.confirmTitle, notification: c.noticeTitle, tooltip: c.tooltipTitle };
    assert.ok(html.includes(labels[kind]));
    assert.ok(html.includes(c.sample));
    assert.equal((html.match(/<form\b/g) || []).length, kind === 'form' ? 1 : 0);
    assert.equal((html.match(/<dialog\b/g) || []).length, kind === 'dialog' || kind === 'confirm' ? 1 : 0);
    if (kind === 'tooltip') { assert.match(html, /role="tooltip"/); assert.match(html, /aria-describedby=/); }
  });
}

test('all 12 executable snippets typecheck, match live SSR, and keep state-helper behavior in sync', async () => {
  const dir = resolve(output, 'control-snippet-check');
  await mkdir(dir, { recursive: true });
  await writeFile(resolve(output, 'control-runtime-kit.mjs'), "export * from './src/kit/ui/primitives.js';\nexport * from './src/kit/ui/controls.js';\n");
  const paths = [];
  for (const locale of ['en', 'ko']) for (const kind of controlKinds) {
    const code = controlSnippet(kind, locale);
    assert.match(code, /export default function Example/);
    assert.doesNotMatch(code, /from ['"].*demo\//);
    const path = `${dir}/${kind}-${locale}.tsx`;
    await writeFile(path, code.replaceAll("'./kit/", `'${resolve('src/kit')}/`));
    paths.push(path);
    const runtimeCode = code.replace("'./kit/index.js'", "'../control-runtime-kit.mjs'").replace("import './kit/styles.css';", '');
    const js = ts.transpileModule(runtimeCode, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React } }).outputText;
    const runtimePath = `${dir}/${kind}-${locale}.mjs`;
    await writeFile(runtimePath, js);
    const module = await import(pathToFileURL(runtimePath).href);
    const normalize = html => html.replace(/:R[\w]+:/g, ':ID:');
    const copiedHtml = normalize(render(module.default, {}));
    const actualHtml = normalize(render(ControlStudio, { kind, locale }));
    assert.equal(copiedHtml, `<div class="kk-root">${actualHtml}</div>`, `${kind}/${locale} snippet renders the same markup`);
    if (kind === 'form') {
      let copied = module.initialFormState(), actual = initialFormState();
      const actions = [{ type: 'submit' }, { type: 'fill' }, { type: 'submit' }, { type: 'change', values: { target: '0' } }, { type: 'submit' }, { type: 'change', values: { name: '  Trimmed title  ', target: '02500' } }, { type: 'submit' }, { type: 'dismiss' }];
      for (const action of actions) {
        copied = module.transitionReportForm(copied, action);
        actual = transitionReportForm(actual, action, locale);
        assert.deepEqual(copied, actual);
      }
    }
    if (kind === 'filters' || kind === 'confirm') for (const filters of [defaultReportFilters, { query: 'no-match', category: 'all', status: 'all' }, { query: '', category: 'revenue', status: 'watch' }]) assert.deepEqual(module.filterReports(sampleReports(locale), filters), filterReports(sampleReports(locale), filters));
    if (kind === 'confirm') {
      let copied = module.initialConfirmationState(), actual = initialConfirmationState();
      for (const action of ['confirm', 'open', 'cancel', 'open', 'confirm', 'restore']) {
        copied = module.transitionConfirmation(copied, action); actual = transitionConfirmation(actual, action); assert.deepEqual(copied, actual);
      }
    }
    if (kind === 'notification') for (const visible of [true, false]) for (const action of ['show', 'dismiss']) assert.equal(module.transitionNotification(visible, action), transitionNotification(visible, action));
  }
  const program = ts.createProgram(paths, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.React, strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: file => file, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n' }));
});
