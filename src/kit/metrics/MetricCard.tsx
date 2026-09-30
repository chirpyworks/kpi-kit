import React, { useId } from 'react';
import type { KitLocale, MetricPattern, MetricView, SeriesPoint } from '../contracts.js';
import { compareMetric, formatMetricValue, targetResult } from '../core/metrics.js';
import { seriesSegments, zeroDomain } from '../core/chart.js';
import { Badge } from '../ui/primitives.js';
export function MetricCard({ metric, pattern = 'comparison', trend, locale = 'en', trendPlacement = 'below' }: { metric: MetricView; pattern?: MetricPattern; trend?: readonly SeriesPoint[]; locale?: KitLocale; trendPlacement?: 'below' | 'inline' }) {
  const id = useId();
  const ko = locale === 'ko';
  const change = compareMetric(metric); // Validates the public contract, including units.
  const target = targetResult(metric);
  const { definition: d, current } = metric;
  const quality = current.quality;
  const format = (n: number | null) => formatMetricValue(n, d.unit, locale);
  let changeText = ko ? '비교할 수 없음' : 'Comparison unavailable';
  if (change.state === 'comparable') {
    const sign = (change.value ?? 0) > 0 ? '+' : '';
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(change.value ?? 0);
    changeText = d.comparison === 'absolute' ? `${sign}${format(change.value)}` : `${sign}${number}${d.comparison === 'percentage-points' ? (ko ? '%p' : ' pp') : '%'}`;
  } else if (change.state === 'new') changeText = `${ko ? '이전 값 0 · 차이' : 'Zero baseline · change'} ${format(change.value)}`;
  const segments = trend ? seriesSegments(trend) : [];
  const [min, max] = zeroDomain(trend?.map(p => p.value) ?? []);
  const x = (index: number) => trend && trend.length > 1 ? 4 + index / (trend.length - 1) * 212 : 110;
  const y = (value: number) => 48 - (value - min) / (max - min) * 40;
  return <article className={`kk-metric kk-metric--${pattern}${trendPlacement === 'inline' && trend ? ' kk-metric--inline-trend' : ''}`} data-kit-metric={d.id} data-trend-sentiment={change.sentiment} aria-labelledby={id}>
    <div className="kk-metric-heading"><h3 id={id}>{d.title}</h3><details className="kk-definition"><summary aria-label={`${d.title}: ${ko ? '정의' : 'definition'}`}>i</summary><p>{d.description}<br /><small>{metric.sourceLabel} · {metric.scope.startDate} — {metric.scope.endDate} · {metric.scope.timeZone}</small></p></details></div>
    <div className="kk-metric-value" data-value={current.value ?? 'null'}>{format(current.value)}</div>
    {pattern === 'target' && d.target && <div className={`kk-target-verdict kk-target-verdict--${target.met === null ? 'unknown' : target.met ? 'met' : 'missed'}`}><i aria-hidden="true"/>{target.met === null ? (ko ? '목표 판단 보류' : 'Target not assessed') : target.met ? (ko ? '목표 충족' : 'Target met') : (ko ? '목표 미달' : 'Target not met')}<span>· {d.target.relation === 'at-least' ? '≥' : '≤'} {format(d.target.value)}</span></div>}
    {pattern !== 'number' && change.state !== 'none' && <div className={`kk-change kk-change--${change.sentiment}`}><span>{changeText}</span>{change.state === 'comparable' && <small>{ko ? '이전 기간 대비' : 'vs previous period'}</small>}</div>}
    {(pattern === 'sparkline' || trendPlacement === 'inline') && trend && <><svg className={`kk-sparkline${trendPlacement === 'inline' ? ' kk-sparkline--inline' : ''}`}  viewBox="0 0 220 56" role="img" aria-label={trendPlacement === 'inline' ? `${d.title}: ${trend.map(p => `${p.label}: ${format(p.value)}`).join('; ')}` : ko ? '미니 추세 · 아래 원값 보기' : 'Sparkline; values available below'}>
      <defs><linearGradient id={`${id}-trend-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".2"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
      {segments.map((segment, i) => <g key={i}>
        {trendPlacement === 'inline' && segment.length > 1 && <polygon points={`${x(segment[0].index)},${y(0)} ${segment.map(p => `${x(p.index)},${y(p.value)}`).join(' ')} ${x(segment[segment.length-1].index)},${y(0)}`} fill={`url(#${id}-trend-fill)`}/>}
        <polyline points={segment.map(p => `${x(p.index)},${y(p.value)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {segment.length === 1 && <circle cx={x(segment[0].index)} cy={y(segment[0].value)} r="3" fill="currentColor" />}
        {trendPlacement === 'inline' && segment.length > 1 && i === segments.length-1 && <circle className="kk-sparkline-endpoint" cx={x(segment[segment.length-1].index)} cy={y(segment[segment.length-1].value)} r="3" fill="currentColor"/>}
      </g>)}
    </svg>{trendPlacement !== 'inline' && <details className="kk-data-alternative"><summary>{ko ? '추세 원값' : 'Trend values'}</summary><ul>{trend.map(p => <li key={p.key}>{p.label}: {format(p.value)}</li>)}</ul></details>}</>}
    {pattern === 'sparkline' && !trend && <small>{ko ? '추세 데이터가 제공되지 않았습니다.' : 'No trend data supplied.'}</small>}
    {pattern === 'target' && !d.target && <small>{ko ? '목표가 정의되지 않았습니다.' : 'No target defined.'}</small>}
    {pattern === 'target' && d.target && target.ratio !== null && <div className="kk-target"><div className="kk-target-track" data-met={String(target.met)}><span style={{ width: `${Math.max(0, Math.min(100, (target.ratio ?? 0) * 100))}%` }}/></div><small>{ko ? '위 막대는 실제값과 목표의 비율입니다.' : 'Bar shows the actual value relative to the target.'}</small></div>}
    {(pattern === 'status' || quality.coverage !== 'complete' || quality.freshness !== 'current') && <div className="kk-quality"><Badge tone={quality.coverage === 'complete' ? 'neutral' : 'warning'}>{ko ? ({ complete: '완전한 데이터', partial: '일부 데이터', missing: '관측 없음' }[quality.coverage]) : quality.coverage}</Badge><Badge tone={quality.freshness === 'stale' ? 'warning' : 'neutral'}>{ko ? ({ current: '최신', stale: '오래됨', unknown: '갱신 시점 미상' }[quality.freshness]) : quality.freshness}</Badge>{quality.reasons?.map(reason => <small key={reason}>{reason}</small>)}</div>}
    {current.value === null && <small>{ko ? '관측 없음 · 0이 아님' : 'Not observed · not zero'}</small>}
  </article>;
}
