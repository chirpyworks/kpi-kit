import React, { useId } from 'react';
import type { ChartSeries, KitLocale, MultiSeriesPoint, SeriesPoint, Unit } from '../contracts.js';
import { chartScale, donutParts, stackedTotals, validateMultiSeries, validatePoints, waterfallSteps } from '../core/chart.js';
import { formatMetricValue } from '../core/metrics.js';
import { StatePanel } from '../ui/primitives.js';

type Common = { title: string; locale?: KitLocale; unit?: Unit };
const fallbackUnit: Unit = { kind: 'number', label: '' };
const valueText = (v: number | null, unit: Unit | undefined, locale: KitLocale) =>
  v === null ? '—' : formatMetricValue(v, unit ?? fallbackUnit, locale);

function Alternative({ points, unit, locale }: { points: readonly SeriesPoint[]; unit?: Unit; locale: KitLocale }) {
  return <details className="kk-data-alternative"><summary>{locale === 'ko' ? '데이터 표' : 'Data table'}</summary>
    <table><thead><tr><th>{locale === 'ko' ? '항목' : 'Item'}</th><th>{locale === 'ko' ? '값' : 'Value'}</th></tr></thead>
      <tbody>{points.map(p => <tr key={p.key}><td>{p.label}</td><td>{valueText(p.value, unit, locale)}</td></tr>)}</tbody>
    </table></details>;
}

function Empty({ title, locale }: { title: string; locale: KitLocale }) {
  return <StatePanel title={title} message={locale === 'ko' ? '표시할 관측값이 없습니다.' : 'No observed values to display.'} />;
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return <figure className="kk-chart" aria-labelledby={id}><figcaption id={id} className="kk-chart-title">{title}</figcaption>{children}</figure>;
}

export function SeriesChart({ title, points, unit, locale = 'en', area = false }: Common & { points: readonly SeriesPoint[]; area?: boolean }) {
  validatePoints(points);
  const observed = points.filter(p => p.value !== null);
  if (!observed.length) return <Empty title={title} locale={locale} />;
  const { min, max } = chartScale(points.map(p => p.value));
  const width = 720, height = 280, left = 52, right = 14, top = 16, bottom = 38;
  const innerW = width - left - right, innerH = height - top - bottom;
  const x = (i: number) => left + (points.length <= 1 ? innerW / 2 : i / (points.length - 1) * innerW);
  const y = (v: number) => top + (max - v) / Math.max(1e-12, max - min) * innerH;
  const segments: { index: number; value: number }[][] = [];
  let current: { index: number; value: number }[] = [];
  points.forEach((p, i) => { if (p.value === null) { if (current.length) segments.push(current); current = []; } else current.push({ index: i, value: p.value }); });
  if (current.length) segments.push(current);
  const zeroY = y(0);
  return <Frame title={title}><div className="kk-chart-stage" data-chart={area ? 'area' : 'line'}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      <line className="kk-axis" x1={left} y1={zeroY} x2={width-right} y2={zeroY} />
      {segments.map((seg, si) => {
        const pts = seg.map(p => `${x(p.index)},${y(p.value)}`).join(' ');
        const poly = area && seg.length > 1 ? `${x(seg[0].index)},${zeroY} ${pts} ${x(seg[seg.length-1].index)},${zeroY}` : '';
        return <g key={si}>{poly && <polygon className="kk-area-fill" points={poly} />}
          {seg.length > 1 ? <polyline className="kk-line" points={pts} fill="none" /> : <circle className="kk-dot" cx={x(seg[0].index)} cy={y(seg[0].value)} r="4" />}</g>;
      })}
    </svg></div><Alternative points={points} unit={unit} locale={locale} /></Frame>;
}

export function BarChart({ title, points, unit, locale = 'en' }: Common & { points: readonly SeriesPoint[] }) {
  validatePoints(points); const observed = points.filter(p => p.value !== null);
  if (!observed.length) return <Empty title={title} locale={locale} />;
  const max = Math.max(...observed.map(p => Math.abs(p.value!)), 1);
  return <Frame title={title}><div className="kk-bars" data-chart="bar">{points.map(p => <div className="kk-bar-row" key={p.key}>
    <span>{p.label}</span><div className="kk-bar-track">{p.value !== null && <i style={{ width: `${Math.min(100, Math.abs(p.value)/max*100)}%` }} data-negative={p.value < 0 || undefined} />}</div>
    <strong>{valueText(p.value, unit, locale)}</strong></div>)}</div><Alternative points={points} unit={unit} locale={locale} /></Frame>;
}

export function VerticalBarChart({ title, points, unit, locale = 'en' }: Common & { points: readonly SeriesPoint[] }) {
  validatePoints(points); const vals = points.map(p => p.value); const [min,max] = [Math.min(0,...vals.filter((v):v is number=>v!==null)), Math.max(0,...vals.filter((v):v is number=>v!==null))];
  const span = Math.max(1e-12,max-min);
  return <Frame title={title}><div className="kk-vbars" data-chart="vertical-bar">{points.map(p => <div className="kk-vbar" key={p.key}>
    <div className="kk-vbar-stage">{p.value !== null && <i style={{ height: `${Math.abs(p.value)/span*100}%` }} data-negative={p.value < 0 || undefined} />}</div>
    <span>{p.label}</span><strong>{valueText(p.value,unit,locale)}</strong></div>)}</div><Alternative points={points} unit={unit} locale={locale} /></Frame>;
}

function MultiAlternative({ points, series, locale }: { points: readonly MultiSeriesPoint[]; series: readonly ChartSeries[]; locale: KitLocale }) {
  return <details className="kk-data-alternative"><summary>{locale === 'ko' ? '데이터 표' : 'Data table'}</summary><table><thead><tr><th>{locale==='ko'?'항목':'Item'}</th>{series.map(s=><th key={s.key}>{s.label}</th>)}</tr></thead>
    <tbody>{points.map(p=><tr key={p.key}><td>{p.label}</td>{series.map(s=><td key={s.key}>{p.values[s.key] ?? '—'}</td>)}</tr>)}</tbody></table></details>;
}

export function GroupedBarChart({ title, points, series, locale='en' }: Common & { points: readonly MultiSeriesPoint[]; series: readonly ChartSeries[] }) {
  validateMultiSeries(points,series);
  const vals=points.flatMap(p=>series.map(s=>p.values[s.key]??null)).filter((v):v is number=>v!==null); const max=Math.max(...vals.map(Math.abs),1);
  return <Frame title={title}><div data-chart="grouped-bar" className="kk-grouped"><ul className="kk-inline-legend">{series.map(s=><li key={s.key}>{s.label}</li>)}</ul>
    <div className="kk-grouped-grid">{points.map(p=><div className="kk-group" key={p.key}><div>{series.map((s,i)=>{const v=p.values[s.key]??null;return v===null?null:<i key={s.key} style={{height:`${Math.abs(v)/max*100}%`, opacity: Math.max(.3, 1 - i * .2)}}/>})}</div><span>{p.label}</span></div>)}</div>
    </div><MultiAlternative points={points} series={series} locale={locale}/></Frame>;
}

export function StackedBarChart({ title, points, series, locale='en' }: Common & { points: readonly MultiSeriesPoint[]; series: readonly ChartSeries[] }) {
  validateMultiSeries(points,series,{stacked:true}); const totals=stackedTotals(points,series); const max=Math.max(...totals.filter((v):v is number=>v!==null),1);
  return <Frame title={title}><div data-chart="stacked-bar" className="kk-stacked"><ul className="kk-inline-legend">{series.map(s=><li key={s.key}>{s.label}</li>)}</ul>
    <div className="kk-grouped-grid">{points.map((p,pi)=><div className="kk-group" key={p.key}><div className="kk-stack">{series.map((s,i)=>{const v=p.values[s.key]??null;return v===null?null:<i key={s.key} style={{height:`${v/max*100}%`, opacity: Math.max(.3, 1 - i * .2)}}/>})}</div><span>{p.label}</span></div>)}</div>
    </div><MultiAlternative points={points} series={series} locale={locale}/></Frame>;
}

export function WaterfallChart({ title, start, changes, unit, locale='en' }: Common & { start:number; changes: readonly SeriesPoint[] }) {
  const result=waterfallSteps(start,changes); const all=result.steps.flatMap(s=>[s.from,s.to]); const min=Math.min(0,...all),max=Math.max(0,...all),span=Math.max(1,max-min);
  return <Frame title={title}><div data-chart="waterfall" className="kk-waterfall">{result.steps.map(s=><div key={s.key} className="kk-waterfall-col"><div className="kk-waterfall-stage"><i data-kind={s.kind} style={{height:`${Math.abs(s.to-s.from || s.to)/span*100}%`,bottom:`${((Math.min(s.from,s.to)-min)/span)*100}%`}}/></div><span>{s.label}</span><strong>{valueText(s.value,unit,locale)}</strong></div>)}</div>
    <details className="kk-data-alternative"><summary>{locale==='ko'?'계산 근거':'Reconciliation'}</summary><p>{result.complete ? `${valueText(start,unit,locale)} → ${valueText(result.end,unit,locale)}` : (locale==='ko'?'누락된 변화 항목이 있어 기말값을 계산하지 않습니다.':'Closing value withheld because a movement is missing.')}</p></details></Frame>;
}

export function DonutChart({ title, points, unit, locale='en' }: Common & { points: readonly SeriesPoint[] }) {
  const {total,parts}=donutParts(points); let offset=0;
  return <Frame title={title}><div data-chart="donut" className="kk-donut-wrap"><svg viewBox="0 0 120 120" role="img" aria-label={title}>{parts.map((p,i)=>{const dash=p.fraction*251.33, el=<circle key={p.key} className="kk-donut-part" cx="60" cy="60" r="40" pathLength="251.33" strokeDasharray={`${dash} ${251.33-dash}`} strokeDashoffset={-offset} data-series={i}/>;offset+=dash;return el;})}<circle className="kk-donut-hole" cx="60" cy="60" r="28"/></svg><div><strong className="kk-donut-total">{valueText(total,unit,locale)}</strong><span>{locale==='ko'?'합계':'Total'}</span></div></div><Alternative points={points} unit={unit} locale={locale}/></Frame>;
}

export function BulletChart({ title, actual, target, unit, locale='en' }: Common & { actual:number; target:number }) {
  if (![actual,target].every(v=>Number.isFinite(v)&&v>=0)) throw new RangeError('Bullet values must be finite and nonnegative.');
  const max=Math.max(actual,target,1)*1.08;
  return <Frame title={title}><div data-chart="bullet" className="kk-bullet"><div className="kk-bullet-track"><i style={{width:`${actual/max*100}%`}}/><b style={{left:`${target/max*100}%`}}/></div><p className="kk-chart-caption">{locale==='ko'?'실제':'Actual'} {valueText(actual,unit,locale)} · {locale==='ko'?'목표':'Target'} {valueText(target,unit,locale)}</p></div></Frame>;
}
