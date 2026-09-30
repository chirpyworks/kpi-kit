import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVAILABLE_RANGE, INITIAL_RANGE, SYNTHETIC_DAILY_DATA, buildDashboard, dashboardMeta,
} from '../.test-build/src/demo/dashboard-data.js';
import { compareMetric, rowsToCsv, validateMetricView } from '../.test-build/src/kit/core/index.js';

const kinds = ['revenue', 'customers', 'operations'];
const total = (rows, field) => rows.reduce((value, row) => value + row[field], 0);
const selected = (kind, range = INITIAL_RANGE) => SYNTHETIC_DAILY_DATA[kind].filter(row => row.date >= range.start && row.date <= range.end);
const findMetric = (model, id) => model.metrics.find(metric => metric.definition.id === id);

test('synthetic records cover exactly 28 UTC days and four exclusive categories per domain', () => {
  assert.deepEqual(AVAILABLE_RANGE, { start: '2026-08-18', end: '2026-09-14' });
  for (const kind of kinds) {
    const data = SYNTHETIC_DAILY_DATA[kind];
    assert.equal(data.length, 28 * 4);
    assert.equal(new Set(data.map(row => row.date)).size, 28);
    assert.equal(new Set(data.map(row => `${row.date}:${row.category}`)).size, data.length);
    assert.equal(data[0].date, AVAILABLE_RANGE.start);
    assert.equal(data.at(-1).date, AVAILABLE_RANGE.end);
    assert.ok(Object.isFrozen(data) && data.every(Object.isFrozen));
  }
});

for (const kind of kinds) {
  test(`${kind}: all four metrics validate and date filters recompute every dashboard surface`, () => {
    const first = buildDashboard(kind, INITIAL_RANGE, 'en');
    const range = { start: '2026-09-08', end: '2026-09-14' };
    const second = buildDashboard(kind, range, 'en');
    assert.equal(first.status, 'ready');
    assert.equal(first.coverage, 'complete');
    assert.equal(first.metrics.length, 4);
    first.metrics.forEach(validateMetricView);
    second.metrics.forEach(validateMetricView);
    assert.notDeepEqual(first.metrics.map(metric => metric.current.value), second.metrics.map(metric => metric.current.value));
    assert.notDeepEqual(first.trend, second.trend);
    assert.notDeepEqual(first.categories, second.categories);
    assert.notDeepEqual(first.rows, second.rows);
    assert.equal(first.trend.length, 7);
    assert.equal(second.rows.length, 28);
    assert.ok(second.rows.every(row => row.date >= range.start && row.date <= range.end));
    assert.equal(new Set(second.rows.map(row => row.id)).size, second.rows.length);
    for (const metric of second.metrics) {
      assert.equal(metric.scope.startDate, range.start);
      assert.equal(metric.scope.endDate, range.end);
      assert.equal(metric.scope.timeZone, 'UTC');
      assert.deepEqual(metric.scope.segment.dashboard, [kind]);
    }
    assert.equal(first.trend.reduce((sum, row) => sum + row.value, 0), first.categories.reduce((sum, row) => sum + row.value, 0));
    const chartTotal = first.categories.reduce((sum, row) => sum + row.value, 0);
    assert.ok(Math.abs(chartTotal * (kind === 'revenue' ? 100 : 1) - first.metrics[0].current.value) < 1e-7);
    assert.ok(first.columns.every(column => column.label.length > 0));
    assert.ok(first.columns.every(column => first.rows.every(row => column.value(row) !== undefined)));
  });

  test(`${kind}: baseline is the immediately preceding equal-length period`, () => {
    const model = buildDashboard(kind, INITIAL_RANGE, 'en');
    assert.deepEqual(model.previousRange, { start: '2026-08-25', end: '2026-08-31' });
    assert.equal(model.previousAvailable, true);
    const baseline = buildDashboard(kind, model.previousRange, 'en');
    model.metrics.forEach((metric, index) => {
      assert.deepEqual(metric.previous, baseline.metrics[index].current);
      assert.equal(metric.previousScope.startDate, model.previousRange.start);
      assert.equal(metric.previousScope.endDate, model.previousRange.end);
      assert.equal(compareMetric(metric).state, 'comparable');
    });
  });

  test(`${kind}: incomplete previous windows are explicitly unavailable, never truncated`, () => {
    const model = buildDashboard(kind, { start: '2026-08-21', end: '2026-08-27' }, 'en');
    assert.deepEqual(model.previousRange, { start: '2026-08-14', end: '2026-08-20' });
    assert.equal(model.coverage, 'complete');
    assert.equal(model.previousAvailable, false);
    assert.match(model.message, /previous equal-length period is unavailable/);
    model.metrics.forEach(metric => {
      validateMetricView(metric);
      assert.equal(metric.previous, undefined);
      assert.equal(metric.previousScope, undefined);
      assert.equal(compareMetric(metric).state, 'unavailable');
    });
  });

  test(`${kind}: valid empty ranges are missing rather than zero`, () => {
    const model = buildDashboard(kind, { start: '2026-10-01', end: '2026-10-07' }, 'en');
    assert.equal(model.status, 'empty');
    assert.equal(model.coverage, 'missing');
    assert.deepEqual(model.rows, []);
    assert.deepEqual(model.trend, []);
    assert.deepEqual(model.categories, []);
    assert.equal(model.metrics.length, 4);
    model.metrics.forEach(metric => {
      validateMetricView(metric);
      assert.equal(metric.current.value, null);
      assert.equal(metric.current.quality.coverage, 'missing');
      assert.ok(metric.current.quality.reasons.length > 0);
    });
  });
}

test('revenue records reconcile gross, refunds and net values in integer cents', () => {
  const data = selected('revenue');
  const model = buildDashboard('revenue', INITIAL_RANGE, 'en');
  SYNTHETIC_DAILY_DATA.revenue.forEach(row => {
    assert.equal(row.netSalesCents, row.grossSalesCents - row.refundsCents);
    assert.ok(Number.isSafeInteger(row.netSalesCents));
    assert.ok(row.refundedOrders <= row.orders);
  });
  assert.equal(findMetric(model, 'net-sales').current.value, total(data, 'netSalesCents'));
  assert.deepEqual(findMetric(model, 'net-sales').definition.unit, { kind: 'money', currency: 'USD', exponent: 2 });
  assert.equal(findMetric(model, 'average-order').current.value, Math.round(total(data, 'netSalesCents') / total(data, 'orders')));
  const refund = findMetric(model, 'refund-rate').current;
  assert.equal(refund.numerator, total(data, 'refundedOrders'));
  assert.equal(refund.denominator, total(data, 'orders'));
  assert.equal(refund.value, refund.numerator / refund.denominator);
  assert.match(rowsToCsv(model.rows, model.columns), /Net sales \(USD\)/);
});

test('activation and failure rates use ratios of sums with exposed denominators', () => {
  for (const [kind, id, numeratorKey, denominatorKey] of [
    ['customers', 'activation-rate', 'activated', 'signups'],
    ['operations', 'failure-rate', 'failed', 'attempted'],
  ]) {
    const data = selected(kind);
    const metric = findMetric(buildDashboard(kind, INITIAL_RANGE, 'en'), id);
    assert.equal(metric.current.numerator, total(data, numeratorKey));
    assert.equal(metric.current.denominator, total(data, denominatorKey));
    assert.equal(metric.current.value, total(data, numeratorKey) / total(data, denominatorKey));
    const unweighted = data.reduce((sum, row) => sum + row[numeratorKey] / row[denominatorKey], 0) / data.length;
    assert.notEqual(metric.current.value, unweighted);
    assert.equal(metric.definition.comparison, 'percentage-points');
  }
});

test('operation totals and mean processing time reconcile across successful and failed attempts', () => {
  const data = selected('operations');
  const model = buildDashboard('operations', INITIAL_RANGE, 'en');
  data.forEach(row => assert.equal(row.completed + row.failed, row.attempted));
  assert.equal(findMetric(model, 'completed-jobs').current.value, total(data, 'completed'));
  const mean = findMetric(model, 'mean-duration');
  assert.deepEqual(mean.definition.unit, { kind: 'duration', base: 'ms' });
  assert.equal(mean.current.value, total(data, 'durationTotalMs') / total(data, 'attempted'));
});

test('closing accounts and queues take the final snapshot, never the sum of snapshots', () => {
  for (const [kind, id, field] of [
    ['customers', 'enabled-accounts', 'enabledAccountsEod'],
    ['operations', 'backlog', 'backlogEod'],
  ]) {
    const week = buildDashboard(kind, INITIAL_RANGE, 'en');
    const singleDay = buildDashboard(kind, { start: INITIAL_RANGE.end, end: INITIAL_RANGE.end }, 'en');
    const metric = findMetric(week, id);
    const raw = selected(kind);
    assert.equal(metric.definition.aggregate, 'last');
    assert.equal(metric.current.value, total(raw.filter(row => row.date === INITIAL_RANGE.end), field));
    assert.equal(metric.current.value, findMetric(singleDay, id).current.value);
    assert.notEqual(metric.current.value, total(raw, field));
  }
});

test('snapshot balances reconcile from one observed day to the next', () => {
  for (const category of new Set(SYNTHETIC_DAILY_DATA.customers.map(row => row.category))) {
    const data = SYNTHETIC_DAILY_DATA.customers.filter(row => row.category === category);
    data.slice(1).forEach((row, index) => assert.equal(row.enabledAccountsEod, data[index].enabledAccountsEod + row.signups - row.closed));
  }
  for (const category of new Set(SYNTHETIC_DAILY_DATA.operations.map(row => row.category))) {
    const data = SYNTHETIC_DAILY_DATA.operations.filter(row => row.category === category);
    data.slice(1).forEach((row, index) => assert.equal(row.backlogEod, data[index].backlogEod + row.arrivals - row.attempted));
  }
});

test('partial ranges preserve requested scope and chart gaps, and withhold unavailable closing snapshots', () => {
  const range = { start: '2026-09-12', end: '2026-09-17' };
  for (const kind of kinds) {
    const model = buildDashboard(kind, range, 'en');
    assert.equal(model.status, 'ready');
    assert.equal(model.coverage, 'partial');
    assert.equal(model.rows.length, 12);
    assert.equal(model.trend.length, 6);
    assert.deepEqual(model.trend.slice(3).map(point => point.value), [null, null, null]);
    assert.match(model.message, /Only 3 of 6 days/);
    model.metrics.forEach(metric => {
      validateMetricView(metric);
      assert.equal(metric.scope.startDate, range.start);
      assert.equal(metric.scope.endDate, range.end);
      assert.equal(compareMetric(metric).state, 'unavailable');
    });
    assert.equal(model.metrics[0].current.quality.coverage, 'partial');
    if (kind !== 'revenue') {
      assert.equal(model.metrics[3].current.value, null);
      assert.equal(model.metrics[3].current.quality.coverage, 'missing');
      assert.match(model.metrics[3].current.quality.reasons[0], /requested final day/);
    }
  }
});

test('partial leading coverage retains observed final snapshot while withholding comparison', () => {
  const range = { start: '2026-08-15', end: '2026-08-20' };
  const model = buildDashboard('customers', range, 'en');
  const metric = findMetric(model, 'enabled-accounts');
  assert.equal(metric.current.quality.coverage, 'partial');
  assert.equal(metric.current.value, total(selected('customers', range).filter(row => row.date === range.end), 'enabledAccountsEod'));
  assert.deepEqual(model.trend.slice(0, 3).map(row => row.value), [null, null, null]);
});

test('invalid or unbounded ranges return a non-renderable invalid state without fabricated metric scopes', () => {
  for (const range of [
    { start: '', end: '2026-09-07' },
    { start: '2026-09-31', end: '2026-10-01' },
    { start: '2026-02-29', end: '2026-03-01' },
    { start: '2026-09-07', end: '2026-09-01' },
    { start: '2025-01-01', end: '2026-09-07' },
  ]) {
    const model = buildDashboard('revenue', range, 'en');
    assert.equal(model.status, 'invalid');
    assert.equal(model.coverage, 'missing');
    assert.deepEqual(model.metrics, []);
    assert.deepEqual(model.rows, []);
    assert.equal(model.previousRange, null);
    assert.equal(model.previousAvailable, false);
    assert.ok(model.message.length > 0);
  }
});

test('single-day range compares the prior UTC day and builds one trend observation', () => {
  const model = buildDashboard('revenue', { start: '2026-09-01', end: '2026-09-01' }, 'en');
  assert.deepEqual(model.previousRange, { start: '2026-08-31', end: '2026-08-31' });
  assert.equal(model.trend.length, 1);
  assert.equal(model.rows.length, 4);
  assert.equal(model.previousAvailable, true);
});

test('English and Korean localize domain content without changing values or scope identities', () => {
  assert.deepEqual(dashboardMeta('en').map(item => item.kind), kinds);
  assert.deepEqual(dashboardMeta('ko').map(item => item.kind), kinds);
  for (const kind of kinds) {
    const en = buildDashboard(kind, INITIAL_RANGE, 'en');
    const ko = buildDashboard(kind, INITIAL_RANGE, 'ko');
    assert.notEqual(en.trendTitle, ko.trendTitle);
    assert.notEqual(en.categoriesTitle, ko.categoriesTitle);
    assert.notEqual(en.tableTitle, ko.tableTitle);
    assert.notEqual(en.sourceLabel, ko.sourceLabel);
    assert.notEqual(en.columns[0].label, ko.columns[0].label);
    assert.deepEqual(en.metrics.map(metric => metric.current.value), ko.metrics.map(metric => metric.current.value));
    assert.deepEqual(en.metrics.map(metric => metric.scope), ko.metrics.map(metric => metric.scope));
    assert.deepEqual(en.rows.map(row => row.values), ko.rows.map(row => row.values));
    assert.deepEqual(en.rows.map(row => row.id), ko.rows.map(row => row.id));
    en.metrics.forEach((metric, index) => assert.notEqual(metric.definition.title, ko.metrics[index].definition.title));
    ko.metrics.forEach(validateMetricView);
  }
});

test('each KPI mini trend is computed from its own daily metric and preserves units', async()=>{
  const { metricHistories }=await import('../.test-build/src/demo/dashboard-data.js');
  for(const kind of ['revenue','customers','operations']) {
    const model=buildDashboard(kind,INITIAL_RANGE,'en');
    const histories=metricHistories(model,'en');
    for(const metric of model.metrics) {
      assert.equal(histories[metric.definition.id].length,7);
      for(const point of histories[metric.definition.id]) {
        const day=buildDashboard(kind,{start:point.key,end:point.key},'en');
        assert.equal(point.value,day.metrics.find(m=>m.definition.id===metric.definition.id).current.value);
      }
    }
  }
  const revenue=buildDashboard('revenue',INITIAL_RANGE,'en'), trends=metricHistories(revenue,'en');
  assert.equal(trends['net-sales'][0].value,Math.round(revenue.trend[0].value*100));
  assert.notDeepEqual(trends['orders'].map(p=>p.value),trends['net-sales'].map(p=>p.value));
});
