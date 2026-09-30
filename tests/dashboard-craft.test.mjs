import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';
import { DashboardPreview } from '../.test-build/src/demo/DashboardPreview.js';
import { buildDashboard, dashboardMeta, INITIAL_RANGE } from '../.test-build/src/demo/dashboard-data.js';
import { MetricCard, compareMetric } from '../.test-build/src/kit/index.js';

const metricValue=(metric,value)=>metric.definition.unit.kind==='count'||metric.definition.unit.kind==='money'?Math.round(value):value;
function dashboard(kind,locale,range=INITIAL_RANGE) {
  const model=buildDashboard(kind,range,locale);
  const meta=dashboardMeta(locale).find(item=>item.kind===kind);
  return {model,meta,html:renderToStaticMarkup(React.createElement(DashboardPreview,{model,meta,locale,onRangeChange:()=>{},onInspect:()=>{}}))};
}
for(const locale of ['en','ko'])for(const kind of ['revenue','customers','operations']) {
  test(`${locale} ${kind}: crafted composition retains four true signals and the analytical question`,()=>{
    const {model,meta,html}=dashboard(kind,locale);
    assert.ok(html.includes(meta.question));
    assert.equal((html.match(/data-kit-metric=/g)||[]).length,4);
    assert.match(html,/kk-series-chart--compact/);
    assert.match(html,/class="demo-chart-tools"/);
    assert.match(html,/data-verdict="(?:met|missed)"/);
    for(const metric of model.metrics) {
      assert.ok(html.includes(`data-trend-sentiment="${compareMetric(metric).sentiment}"`));
    }
    assert.ok(html.includes(model.previousRange.start));
    assert.ok(html.includes(locale==='ko'?'기간 비율':'Period ratio'));
  });
}

test('unavailable comparison cannot be enabled by the chart presentation control',()=>{
  const {html}=dashboard('revenue','en',{start:'2026-08-18',end:'2026-08-24'});
  assert.match(html,/<button class="demo-compare-toggle" aria-pressed="false" disabled=""/);
  assert.match(html,/Previous period unavailable/);
  assert.doesNotMatch(html,/data-series="comparison"/);
});

test('invalid and empty scopes retain recovery instead of a decorative chart',()=>{
  for(const range of [{start:'',end:''},{start:'2030-01-01',end:'2030-01-07'}]) {
    const {html}=dashboard('revenue','en',range);
    assert.match(html,/Reset to sample week/);
    assert.doesNotMatch(html,/class="demo-chart-tools"|data-kit-metric=/);
  }
});

test('sparkline tone comes from metric polarity and remains neutral when comparison is unavailable',()=>{
  const metrics=buildDashboard('operations',INITIAL_RANGE,'en').metrics;
  for(const original of metrics)for(const current of [original.current.value*.9,original.current.value*1.1]) {
    const metric={...original,current:{...original.current,value:metricValue(original,current)}};
    // Ratios carry their original evidence; use count/duration records for this visual-polarity check.
    if(metric.definition.unit.kind==='ratio')continue;
    const html=renderToStaticMarkup(React.createElement(MetricCard,{metric}));
    assert.ok(html.includes(`data-trend-sentiment="${compareMetric(metric).sentiment}"`));
  }
  const unknown=buildDashboard('operations',{start:'2026-08-18',end:'2026-08-24'},'en').metrics[0];
  assert.match(renderToStaticMarkup(React.createElement(MetricCard,{metric:unknown})),/data-trend-sentiment="neutral"/);
});

test('craft motion is optional and desktop evidence grids share the same column contract',async()=>{
  const css=await readFile('src/demo/explorer.css','utf8');
  assert.equal((css.match(/grid-template-columns:var\(--demo-analysis-columns,minmax\(0,2fr\) minmax\(300px,1fr\)\)/g)||[]).length,2);
  assert.match(css,/@media\(prefers-reduced-motion:no-preference\)/);
  assert.match(css,/animation:none!important;transition:none!important/);
  assert.doesNotMatch(css,/\.demo-kpi-cell:nth-child\([234]\) \.kk-sparkline--inline/);
});

test('partial coverage keeps target assessment and its bullet tone neutral',async()=>{
  for(const kind of ['revenue','customers','operations']) {
    const {html}=dashboard(kind,'en',{start:'2026-08-16',end:'2026-08-20'});
    assert.match(html,/data-verdict="unknown"/);
    assert.match(html,/Not assessed/);
  }
  const css=await readFile('src/demo/explorer.css','utf8');
  assert.match(css,/\.demo-control-card\[data-verdict=unknown\] \.kk-bullet-track i\{background:var\(--kk-muted\)\}/);
});
