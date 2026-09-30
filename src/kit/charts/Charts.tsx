import React, { useId, useState } from 'react';
import type { ChartSeries, KitLocale, MultiSeriesPoint, SeriesPoint, Unit } from '../contracts.js';
import {
  chartInterval, chartPosition, chartScale, donutParts, multiSeriesValues,
  seriesSegments, stackedTotals, validatePoints, waterfallSteps,
} from '../core/chart.js';
import { formatMetricValue } from '../core/metrics.js';
import { StatePanel } from '../ui/primitives.js';

type Common = {
  title: string;
  locale?: KitLocale;
  unit?: Unit;
  /** Visible explanatory context, also included in the figure's description. */
  description?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  /** Data alternatives are available and collapsed by default. */
  showDataTable?: boolean;
};
type Scale = ReturnType<typeof chartScale>;
type Plot = { width: number; height: number; left: number; right: number; top: number; bottom: number };
const plot: Plot = { width: 560, height: 252, left: 76, right: 20, top: 16, bottom: 46 };
const fallbackUnit: Unit = { kind: 'number', label: '' };
const colors = [
  'var(--kk-accent)', 'var(--kk-chart-2, var(--kk-ink))',
  'var(--kk-chart-3, #397b77)', 'var(--kk-chart-4, #9585bd)',
  'color-mix(in srgb, var(--kk-accent) 60%, var(--kk-surface))',
  'color-mix(in srgb, var(--kk-chart-2, var(--kk-ink)) 60%, var(--kk-surface))',
  'color-mix(in srgb, var(--kk-chart-3, #397b77) 60%, var(--kk-surface))',
  'color-mix(in srgb, var(--kk-chart-4, #9585bd) 60%, var(--kk-surface))',
];
const preciseNumber = (value: number, locale: KitLocale, options: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(locale, {
    notation: Math.abs(value) < 1e-6 ? 'scientific' : 'standard', maximumSignificantDigits: 6, ...options,
  }).format(value);
/** Retain the metric convention, but never describe a nonzero chart mark as zero. */
const valueText = (value: number | null, unit: Unit | undefined, locale: KitLocale): string => {
  if (value === null) return locale === 'ko' ? '누락' : 'Missing';
  const resolvedUnit = unit ?? fallbackUnit;
  const formatted = formatMetricValue(value, resolvedUnit, locale);
  if (value === 0) return formatted;
  const roundedToZero = formatted === formatMetricValue(0, resolvedUnit, locale)
    || formatted === formatMetricValue(-0, resolvedUnit, locale);
  // The shared KPI formatter deliberately bounds extremely small percentages.
  // Source tables can preserve a more specific, still readable observation.
  const tinyRatio = resolvedUnit.kind === 'ratio' && Math.abs(value) < 1e-10;
  if (!roundedToZero && !tinyRatio) return formatted;
  if (resolvedUnit.kind === 'money') {
    const majorUnits = value / 10 ** resolvedUnit.exponent;
    if (majorUnits !== 0)
      return preciseNumber(majorUnits, locale, { style: 'currency', currency: resolvedUnit.currency });
    // Dividing the smallest finite observation can underflow. Shift the
    // scientific exponent as text rather than turning the amount into zero.
    const [coefficient, exponent] = value.toExponential(5).split('e');
    return `${preciseNumber(Number(coefficient), locale)}E${Number(exponent) - resolvedUnit.exponent} ${resolvedUnit.currency}`;
  }
  if (resolvedUnit.kind === 'ratio') return preciseNumber(value, locale, { style: 'percent', notation: 'scientific' });
  if (resolvedUnit.kind === 'duration') return `${preciseNumber(value, locale)} ms`;
  return `${preciseNumber(value, locale)}${resolvedUnit.label ? ` ${resolvedUnit.label}` : ''}`;
};
const axisText = (value: number, unit: Unit | undefined, locale: KitLocale) => {
  if (unit?.kind === 'ratio') return valueText(value, unit, locale);
  if (unit?.kind === 'money') {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency', currency: unit.currency, notation: 'compact', maximumFractionDigits: 1,
    });
    const formatted = formatter.format(value / 10 ** unit.exponent);
    return value !== 0 && (formatted === formatter.format(0) || formatted === formatter.format(-0))
      ? valueText(value, unit, locale) : formatted;
  }
  if (unit?.kind === 'duration') return valueText(value, unit, locale);
  return new Intl.NumberFormat(locale, {
    notation: value !== 0 && Math.abs(value) < .01 ? 'scientific' : 'compact', maximumFractionDigits: 2,
  }).format(value);
};
const domain = (scale: Scale): [number, number] => [scale.min, scale.max];
const innerWidth = (p: Plot) => p.width - p.left - p.right;
const innerHeight = (p: Plot) => p.height - p.top - p.bottom;
const yPosition = (value: number, scale: Scale, p: Plot = plot) => p.height - p.bottom - chartPosition(value, domain(scale)) * innerHeight(p);
const shorten = (label: string, length = 12) => label.length > length ? `${label.slice(0, length - 1)}…` : label;
const unitLabel = (unit: Unit | undefined, locale: KitLocale) => {
  if (!unit) return undefined;
  if (unit.kind === 'money') return unit.currency;
  if (unit.kind === 'ratio') return '%';
  if (unit.kind === 'duration') return locale === 'ko' ? '시간' : 'Duration';
  return unit.label || (unit.kind === 'count' ? (locale === 'ko' ? '개수' : 'Count') : undefined);
};
const observationSummary = (values: readonly (number | null)[], locale: KitLocale) => {
  const missing = values.filter(value => value === null).length;
  return locale === 'ko'
    ? `관측값 ${values.length - missing}개, 누락 ${missing}개. 누락은 0이 아닙니다.`
    : `${values.length - missing} observed values; ${missing} missing. Missing is not zero.`;
};
const pointDescription = (points: readonly SeriesPoint[], unit: Unit | undefined, locale: KitLocale) =>
  `${observationSummary(points.map(point => point.value), locale)} ${points.map(point => `${point.label}: ${valueText(point.value, unit, locale)}`).join('; ')}`;

function Alternative({ title, points, unit, locale }: { title: string; points: readonly SeriesPoint[]; unit?: Unit; locale: KitLocale }) {
  return <details className="kk-data-alternative"><summary>{locale === 'ko' ? '데이터 표' : 'Data table'}</summary>
    <table aria-label={title}><thead><tr><th scope="col">{locale === 'ko' ? '항목' : 'Item'}</th><th scope="col">{locale === 'ko' ? '값' : 'Value'}</th></tr></thead>
      <tbody>{points.map(point => <tr key={point.key}><th scope="row">{point.label}</th><td>{valueText(point.value, unit, locale)}</td></tr>)}</tbody>
    </table></details>;
}

function Empty({ title, locale }: { title: string; locale: KitLocale }) {
  return <StatePanel title={title} message={locale === 'ko' ? '표시할 관측값이 없습니다.' : 'No observed values to display.'} />;
}

function Frame({ title, description, children, density, headerActions }: {
  title: string; description?: string; children: React.ReactNode;
  density?: 'comfortable' | 'compact'; headerActions?: React.ReactNode;
}) {
  const id = useId();
  const groupedHeading = density === 'compact' || !!headerActions;
  return <figure className={`kk-chart${density ? ` kk-series-chart kk-series-chart--${density}` : ''}`} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}>
    {groupedHeading ? <figcaption className="kk-chart-heading">
      <div className="kk-chart-heading-copy"><span id={`${id}-title`} className="kk-chart-title">{title}</span>
        {description && <p id={`${id}-description`} className="kk-chart-caption">{description}</p>}
      </div>
      {headerActions && <div className="kk-chart-heading-actions">{headerActions}</div>}
    </figcaption> : <><figcaption id={`${id}-title`} className="kk-chart-title">{title}</figcaption>
      {description && <p id={`${id}-description`} className="kk-chart-caption" style={{ marginBottom: 14 }}>{description}</p>}</>}
    {children}
  </figure>;
}

function Graphic({ title, summary, kind, children, dimensions = plot, valueAxisLabel, categoryAxisLabel, interactive = false, maxHeight, minWidth = 440 }: {
  title: string; summary: string; kind: string; children: React.ReactNode; dimensions?: Plot;
  valueAxisLabel?: string; categoryAxisLabel?: string; interactive?: boolean; maxHeight?: number; minWidth?: number;
}) {
  const id = useId();
  return <div className="kk-chart-stage" data-chart={kind}>
    {valueAxisLabel && <p className="kk-chart-caption" style={{ marginBottom: 6 }}>{valueAxisLabel}</p>}
    <div className="kk-chart-scroll" style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} role={interactive ? 'group' : 'img'} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
        style={{ minWidth, maxHeight: maxHeight ?? 'none', fontSize: 13, fontFamily: 'inherit' }}>
        <title id={`${id}-title`}>{title}</title><desc id={`${id}-description`}>{summary}</desc>{children}
      </svg>
    </div>
    {categoryAxisLabel && <p className="kk-chart-caption" style={{ textAlign: 'center', marginTop: 4 }}>{categoryAxisLabel}</p>}
  </div>;
}

function ValueAxis({ scale, unit, locale, dimensions = plot }: { scale: Scale; unit?: Unit; locale: KitLocale; dimensions?: Plot }) {
  return <g className="kk-chart-value-axis" aria-hidden="true">{scale.ticks.map((tick, index) => {
    const y = yPosition(tick, scale, dimensions);
    return <g key={index}>
      <line x1={dimensions.left} y1={y} x2={dimensions.width - dimensions.right} y2={y}
        stroke={tick === 0 ? 'var(--kk-line-strong)' : 'var(--kk-chart-grid, var(--kk-line))'} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <text x={dimensions.left - 10} y={y + 4} textAnchor="end" fill="var(--kk-muted)">{axisText(tick, unit, locale)}</text>
    </g>;
  })}</g>;
}

function CategoryLabels({ labels, x, dimensions = plot }: { labels: readonly string[]; x: (index: number) => number; dimensions?: Plot }) {
  const every = Math.max(1, Math.ceil(labels.length / 7));
  return <g fill="var(--kk-muted)" aria-hidden="true">{labels.map((label, index) => index % every === 0 || index === labels.length - 1
    ? <text key={index} x={x(index)} y={dimensions.height - dimensions.bottom + 26} textAnchor={x(index) === dimensions.left ? 'start' : x(index) === dimensions.width - dimensions.right ? 'end' : 'middle'}><title>{label}</title>{shorten(label)}</text>
    : null)}</g>;
}

function Legend({ items, locale }: { items: readonly { key: string; label: string; color: string; value?: string; line?: 'solid' | 'dashed' }[]; locale: KitLocale }) {
  return <ul className="kk-chart-legend" aria-label={locale === 'ko' ? '범례' : 'Legend'}
    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', listStyle: 'none', padding: 0, margin: '0 0 14px', fontSize: 12, color: 'var(--kk-muted)' }}>
    {items.map(item => <li key={item.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span aria-hidden="true" data-line={item.line} style={item.line
        ? { width: 20, height: 0, borderTop: `2px ${item.line} ${item.color}`, flexShrink: 0 }
        : { width: 9, height: 9, borderRadius: 2, background: item.color, flexShrink: 0 }} />
      <span>{item.label}{item.value && <strong style={{ marginLeft: 8, color: 'var(--kk-ink)' }}>{item.value}</strong>}</span>
    </li>)}
  </ul>;
}

function MissingMark({ x, y }: { x: number; y: number }) {
  return <text x={x} y={y - 7} textAnchor="middle" fill="var(--kk-muted)" data-state="missing">—</text>;
}

/** A genuine zero is a baseline tick, never a minimum-height nonzero bar. */
function IntervalBar({ from, to, scale, x, width, color, label, dimensions = plot, ...data }: {
  from: number; to: number; scale: Scale; x: number; width: number; color: string; label: string; dimensions?: Plot;
  'data-kind'?: string; 'data-negative'?: boolean; 'data-series'?: string;
}) {
  const interval = chartInterval(from, to, domain(scale))!;
  const y = dimensions.height - dimensions.bottom - interval.end * innerHeight(dimensions);
  return <g {...data} data-from={from} data-to={to} data-state={from === to ? 'zero' : 'observed'}>
    <title>{label}</title>
    <rect x={x} y={y} width={width} height={interval.size * innerHeight(dimensions)} rx={2} fill={color} />
    {from === to && <line x1={x} x2={x + width} y1={y} y2={y} stroke={color} strokeWidth={2} />}
  </g>;
}

function SeriesAlternative({ title, points, comparisonPoints, seriesLabel, comparisonLabel, unit, locale }: {
  title: string; points: readonly SeriesPoint[]; comparisonPoints: readonly SeriesPoint[];
  seriesLabel: string; comparisonLabel: string; unit?: Unit; locale: KitLocale;
}) {
  const itemLabel = locale === 'ko' ? '항목' : 'Item';
  return <details className="kk-data-alternative"><summary>{locale === 'ko' ? '데이터 표' : 'Data table'}</summary>
    <table aria-label={title}><thead><tr>
      <th scope="col">{seriesLabel} · {itemLabel}</th><th scope="col">{seriesLabel}</th>
      <th scope="col">{comparisonLabel} · {itemLabel}</th><th scope="col">{comparisonLabel}</th>
    </tr></thead><tbody>{points.map((point, index) => <tr key={point.key}>
      <th scope="row">{point.label}</th><td>{valueText(point.value, unit, locale)}</td>
      <td>{comparisonPoints[index].label}</td><td>{valueText(comparisonPoints[index].value, unit, locale)}</td>
    </tr>)}</tbody></table>
  </details>;
}

/** Keep the observed point and its full value inside the viewport, including extrema. */
function PointAnnotation({ x, y, label, value, index, latest }: {
  x: number; y: number; label: string; value: string; index: number; latest: boolean;
}) {
  const estimatedWidth = [...value].reduce((width, char) => width + (char.charCodeAt(0) > 255 ? 13 : 7.5), 0);
  const width = Math.min(innerWidth(plot), Math.max(152, Math.min([...label].length * 6 + 24, 224), estimatedWidth + 24));
  const height = 48;
  const boxX = Math.max(plot.left, Math.min(plot.width - plot.right - width, x > plot.width / 2 ? x - width - 14 : x + 14));
  const boxY = Math.max(plot.top, Math.min(plot.height - plot.bottom - height, y - height - 14 >= plot.top ? y - height - 14 : y + 14));
  const edgeX = Math.max(boxX + 12, Math.min(boxX + width - 12, x));
  const edgeY = y < boxY ? boxY : boxY + height;
  return <g className="kk-chart-callout" data-point-index={index} data-kind={latest ? 'latest' : 'inspection'} aria-hidden="true" pointerEvents="none">
    <line x1={x} y1={y} x2={edgeX} y2={edgeY} stroke="var(--kk-accent)" strokeOpacity={.55} vectorEffect="non-scaling-stroke" />
    <rect x={boxX} y={boxY} width={width} height={height} rx={5} fill="var(--kk-surface)" stroke="var(--kk-line-strong)" />
    <text x={boxX + 12} y={boxY + 16} fill="var(--kk-muted)" fontSize={10}>{shorten(label, Math.floor((width - 24) / 6))}</text>
    <text x={boxX + 12} y={boxY + 35} fill="var(--kk-ink)" fontSize={14} fontWeight={650}
      style={{ fontVariantNumeric: 'tabular-nums' }} textLength={estimatedWidth > width - 24 ? width - 24 : undefined}
      lengthAdjust={estimatedWidth > width - 24 ? 'spacingAndGlyphs' : undefined}>{value}</text>
  </g>;
}

export function SeriesChart({ title, description, points, unit, locale = 'en', area = false, xAxisLabel, yAxisLabel, showDataTable = true,
  comparisonPoints, comparisonLabel, seriesLabel, interactive = false, maxHeight, density = 'comfortable', headerActions,
}: Common & {
  points: readonly SeriesPoint[]; area?: boolean;
  /** Previous-period observations, aligned by index rather than by category/date. Must have the same length. */
  comparisonPoints?: readonly SeriesPoint[];
  comparisonLabel?: string;
  seriesLabel?: string;
  /** Pointer/touch selection and arrow-key inspection, including missing observations. */
  interactive?: boolean;
  /** Caps the responsive SVG height without distorting its coordinate system. */
  maxHeight?: number;
  /** Compact composition keeps units and values outside the plot; the default presentation is unchanged. */
  density?: 'comfortable' | 'compact';
  /** Consumer-owned chart controls beside the accessible title and description. */
  headerActions?: React.ReactNode;
}) {
  const gradientId = `${useId()}-area-gradient`;
  const instructionsId = `${useId()}-inspection-instructions`;
  // Keys, rather than array offsets, prevent a replacement dataset retaining an unrelated selection.
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const segments = seriesSegments(points);
  const comparisonSegments = seriesSegments(comparisonPoints ?? []);
  if (maxHeight !== undefined && (!Number.isFinite(maxHeight) || maxHeight <= 0))
    throw new RangeError('Chart maxHeight must be a positive finite number.');
  if (comparisonPoints && comparisonPoints.length !== points.length)
    throw new RangeError('Comparison points must have the same length as the current series; periods align by index.');
  if (!segments.length && !comparisonSegments.length) return <Empty title={title} locale={locale} />;
  const compact = density === 'compact';
  const dimensions = compact ? { ...plot, height: 220, top: 14, bottom: 34 } : plot;
  const scale = chartScale([...points, ...(comparisonPoints ?? [])].map(point => point.value));
  const x = (index: number) => dimensions.left + (points.length <= 1 ? innerWidth(dimensions) / 2 : index / (points.length - 1) * innerWidth(dimensions));
  const y = (value: number) => yPosition(value, scale, dimensions);
  const zeroY = y(0);
  const currentLabel = seriesLabel ?? (locale === 'ko' ? '현재 기간' : 'Current period');
  const previousLabel = comparisonLabel ?? (locale === 'ko' ? '이전 기간' : 'Previous period');
  const comparisonColor = 'var(--kk-chart-comparison, var(--kk-muted))';
  const alignmentNote = compact
    ? locale === 'ko' ? '관측 순서 기준 비교 · 각 기간의 원래 항목 표시' : 'Aligned by observation order · Original labels shown'
    : showDataTable
      ? locale === 'ko' ? '관측 순서로 기간을 정렬합니다. 각 기간의 원래 항목은 데이터 표에서 확인할 수 있습니다.'
        : 'Periods align by observation order. Original period labels are retained in the data table.'
      : locale === 'ko' ? '관측 순서로 기간을 정렬합니다. 날짜가 서로 다를 수 있습니다.' : 'Periods align by observation order; their dates may differ.';
  const summary = comparisonPoints
    ? `${currentLabel}. ${pointDescription(points, unit, locale)} ${previousLabel}. ${pointDescription(comparisonPoints, unit, locale)} ${alignmentNote}`
    : pointDescription(points, unit, locale);
  const latest = (source: ReturnType<typeof seriesSegments>) => source[source.length - 1]?.at(-1);
  const lastPoint = latest(segments);
  const latestIndex = lastPoint?.index ?? latest(comparisonSegments)!.index;
  const inspectIndex = interactive ? [hoverKey, focusKey, selectedKey]
    .map(key => key === null ? -1 : points.findIndex(point => point.key === key)).find(index => index !== -1) ?? -1 : -1;
  const selectedIndex = interactive ? points.findIndex(point => point.key === selectedKey) : -1;
  const activeIndex = inspectIndex === -1 ? latestIndex : inspectIndex;
  const rovingIndex = interactive && focusKey !== null ? points.findIndex(point => point.key === focusKey) : selectedIndex;
  const tabIndex = rovingIndex === -1 ? latestIndex : rovingIndex;
  const currentPoint = points[activeIndex];
  const comparisonPoint = comparisonPoints?.[activeIndex];
  const pointLabel = (index: number) => `${comparisonPoints ? `${currentLabel}, ` : ''}${points[index].label}: ${valueText(points[index].value, unit, locale)}${comparisonPoints ? `; ${previousLabel}, ${comparisonPoints[index].label}: ${valueText(comparisonPoints[index].value, unit, locale)}` : ''}`;
  const clearInspection = () => { setSelectedKey(null); setHoverKey(null); setFocusKey(null); };
  const selectIndex = (index: number) => {
    setSelectedKey(points[index].key); setHoverKey(null); setFocusKey(null);
  };
  const inspectWithKeyboard = (event: React.KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === 'Escape') { event.preventDefault(); clearInspection(); return; }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectIndex(index); return; }
    const next = event.key === 'ArrowLeft' ? Math.max(0, index - 1) : event.key === 'ArrowRight' ? Math.min(points.length - 1, index + 1)
      : event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : -1;
    if (next === -1) return;
    event.preventDefault(); setHoverKey(null); setFocusKey(points[next].key);
    event.currentTarget.ownerSVGElement?.querySelector<SVGGElement>(`[data-inspection-index="${next}"]`)?.focus();
  };
  const readoutLabel = inspectIndex !== -1 ? (locale === 'ko' ? '관측값 확인' : 'Observation')
    : lastPoint ? (locale === 'ko' ? '최근 관측' : 'Latest observed') : (locale === 'ko' ? '이전 기간의 최근 관측' : 'Latest previous observation');
  const renderSegments = (source: readonly SeriesPoint[], sourceSegments: ReturnType<typeof seriesSegments>, compared: boolean) => sourceSegments.map((segment, index) => {
    const path = segment.map(point => `${x(point.index)},${y(point.value)}`).join(' ');
    const seriesKey = compared ? 'comparison' : 'current';
    return <g key={`${seriesKey}-${index}`} data-series={seriesKey}>
      {!compared && area && segment.length > 1 && <polygon className="kk-area-fill" style={{ fill: `url(#${gradientId})`, opacity: 1 }}
        points={`${x(segment[0].index)},${zeroY} ${path} ${x(segment[segment.length - 1].index)},${zeroY}`} />}
      {segment.length > 1 && <polyline className={compared ? 'kk-comparison-line' : 'kk-line'} points={path} fill="none"
        stroke={compared ? comparisonColor : 'var(--kk-accent)'} strokeWidth={compared ? 1.6 : 2}
        strokeDasharray={compared ? '5 5' : undefined} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
      {segment.map(point => {
        const label = `${compared ? `${previousLabel}, ` : comparisonPoints ? `${currentLabel}, ` : ''}${source[point.index].label}: ${valueText(point.value, unit, locale)}`;
        return <g key={point.index} className="kk-chart-point" data-point-index={point.index}>
          <circle className={compared ? 'kk-comparison-dot' : 'kk-dot'} cx={x(point.index)} cy={y(point.value)}
            r={compared ? 2.5 : points.length > 40 ? 2 : 3.5}
            style={compared ? { fill: 'var(--kk-surface)', stroke: comparisonColor, strokeWidth: 1.5 } : undefined}>
            <title>{label}</title>
          </circle>
        </g>;
      })}
    </g>;
  });
  // The comfortable default keeps its existing latest-value annotation.
  // Compact cards reserve an external readout, leaving every plotted observation uncovered.
  const annotationPoint = inspectIndex !== -1
    ? currentPoint.value !== null ? currentPoint : comparisonPoint?.value != null ? comparisonPoint : undefined
    : lastPoint ? points[lastPoint.index] : undefined;
  return <Frame title={title} description={description} density={density} headerActions={headerActions}>
    {compact ? <div className="kk-series-readout" data-point-index={activeIndex} data-kind={inspectIndex === -1 ? 'latest' : 'inspection'}>
      <div className="kk-series-readout-context">
        {interactive ? <button type="button" className="kk-series-reset kk-series-reset--inline" disabled={inspectIndex === -1}
          aria-label={locale === 'ko' ? '최근 관측으로' : 'Latest observation'} onClick={clearInspection}>
          {readoutLabel}{inspectIndex !== -1 && <span aria-hidden="true"> ↶</span>}
        </button> : <span>{readoutLabel}</span>}
        {(yAxisLabel ?? unitLabel(unit, locale)) && <span className="kk-series-unit">{yAxisLabel ?? unitLabel(unit, locale)}</span>}
      </div>
      <div className="kk-series-readout-values" role="list" aria-label={locale === 'ko' ? '범례 및 관측값' : 'Legend and observations'}>
        {[{ key: 'current', label: currentLabel, point: currentPoint, color: colors[0], line: 'solid' },
          ...(comparisonPoint ? [{ key: 'comparison', label: previousLabel, point: comparisonPoint, color: comparisonColor, line: 'dashed' }] : []),
        ].map(item => <div className="kk-series-readout-item" data-series={item.key} role="listitem" key={item.key}>
          <span className="kk-series-readout-label"><i aria-hidden="true" data-line={item.line} style={{ borderTopStyle: item.line as 'solid' | 'dashed', borderTopColor: item.color }} />{item.label}</span>
          <strong data-state={item.point.value === null ? 'missing' : item.point.value === 0 ? 'zero' : 'observed'}>{valueText(item.point.value, unit, locale)}</strong>
          <span className="kk-series-readout-date">{item.point.label}</span>
        </div>)}
      </div>
      {interactive && <div className="kk-series-stepper" role="group" aria-label={locale === 'ko' ? '관측값 선택' : 'Select observation'}>
        <button type="button" aria-label={locale === 'ko' ? '이전 관측값' : 'Previous observation'} disabled={activeIndex === 0} onClick={() => selectIndex(activeIndex - 1)}>‹</button>
        <button type="button" aria-label={locale === 'ko' ? '다음 관측값' : 'Next observation'} disabled={activeIndex === points.length - 1} onClick={() => selectIndex(activeIndex + 1)}>›</button>
      </div>}
    </div> : (comparisonPoints || seriesLabel) && <Legend locale={locale} items={[
      { key: 'current', label: currentLabel, color: colors[0], line: 'solid' },
      ...(comparisonPoints ? [{ key: 'comparison', label: previousLabel, color: comparisonColor, line: 'dashed' as const }] : []),
    ]} />}
    <Graphic title={title} summary={summary} kind={area ? 'area' : 'line'} interactive={interactive}
      maxHeight={maxHeight ?? (compact ? 220 : undefined)} dimensions={dimensions} minWidth={compact ? 560 : 440}
      valueAxisLabel={compact ? undefined : yAxisLabel ?? unitLabel(unit, locale)} categoryAxisLabel={xAxisLabel}>
      {area && <defs><linearGradient id={gradientId} x1="0" y1={dimensions.top} x2="0" y2={dimensions.height - dimensions.bottom} gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="var(--kk-accent)" stopOpacity={.28} />
        <stop offset="70%" stopColor="var(--kk-accent)" stopOpacity={.09} />
        <stop offset="100%" stopColor="var(--kk-accent)" stopOpacity={.015} />
      </linearGradient></defs>}
      <g className="kk-chart-category-grid" aria-hidden="true">{points.map((point, index) => index % Math.max(1, Math.ceil(points.length / 7)) === 0 || index === points.length - 1
        ? <line key={point.key} x1={x(index)} x2={x(index)} y1={dimensions.top} y2={dimensions.height - dimensions.bottom}
          stroke="var(--kk-chart-grid, var(--kk-line))" strokeOpacity={.55} vectorEffect="non-scaling-stroke" /> : null)}</g>
      <ValueAxis scale={scale} unit={unit} locale={locale} dimensions={dimensions} />
      {comparisonPoints && renderSegments(comparisonPoints, comparisonSegments, true)}
      {renderSegments(points, segments, false)}
      {interactive && <g className="kk-chart-inspection-targets">{points.map((point, index) => {
        const left = index === 0 ? dimensions.left : (x(index - 1) + x(index)) / 2;
        const right = index === points.length - 1 ? dimensions.width - dimensions.right : (x(index) + x(index + 1)) / 2;
        return <g key={point.key} className="kk-chart-inspection-target" data-inspection-index={index}
          tabIndex={index === tabIndex ? 0 : -1} role="button" aria-label={pointLabel(index)} aria-pressed={selectedIndex === index}
          aria-describedby={instructionsId}
          onFocus={() => { setHoverKey(null); setFocusKey(point.key); }} onBlur={() => setFocusKey(null)}
          onPointerEnter={event => { if (event.pointerType !== 'touch') setHoverKey(point.key); }} onPointerLeave={() => setHoverKey(null)}
          onClick={() => selectIndex(index)} onKeyDown={event => inspectWithKeyboard(event, index)}>
          <rect x={left} y={dimensions.top} width={right - left} height={innerHeight(dimensions)} fill="transparent" />
        </g>;
      })}</g>}
      {(inspectIndex !== -1 || compact) && <g className="kk-chart-crosshair" aria-hidden="true" pointerEvents="none" data-point-index={activeIndex}>
        <line x1={x(activeIndex)} x2={x(activeIndex)} y1={dimensions.top} y2={dimensions.height - dimensions.bottom}
          stroke="var(--kk-line-strong)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        {currentPoint.value !== null && <circle cx={x(activeIndex)} cy={y(currentPoint.value)} r={5.5} fill="var(--kk-surface)" stroke="var(--kk-accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
        {comparisonPoint?.value != null && <circle cx={x(activeIndex)} cy={y(comparisonPoint.value)} r={4} fill="var(--kk-surface)" stroke={comparisonColor} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
      </g>}
      {!compact && annotationPoint?.value != null && <PointAnnotation x={x(activeIndex)} y={y(annotationPoint.value)}
        label={`${inspectIndex === -1 ? (locale === 'ko' ? '최근 관측' : 'Latest observed') : annotationPoint === currentPoint ? currentLabel : previousLabel} · ${annotationPoint.label}`}
        value={valueText(annotationPoint.value, unit, locale)} index={activeIndex} latest={inspectIndex === -1} />}
      <CategoryLabels labels={points.map(point => point.label)} x={x} dimensions={dimensions} />
    </Graphic>
    <div className="kk-series-footer">
      {comparisonPoints && <p className="kk-chart-caption kk-chart-comparison-note">{alignmentNote}</p>}
      {interactive && !compact && <button type="button" className="kk-series-reset" disabled={inspectIndex === -1} onClick={clearInspection}>
        {locale === 'ko' ? '최근 관측으로' : 'Latest observation'}
      </button>}
    </div>
    {interactive && <span className="kk-sr-only" role="status" aria-live="polite" aria-atomic="true">{selectedIndex === -1 ? '' : pointLabel(selectedIndex)}</span>}
    {interactive && <p id={instructionsId} className="kk-sr-only">{locale === 'ko'
      ? '좌우 방향키로 관측값 이동, Home과 End로 처음과 끝 이동. Enter, 스페이스 또는 탭하여 선택을 유지하고 Escape로 최근 관측값으로 돌아갑니다.'
      : 'Use Left and Right arrows to inspect observations, Home and End for first and last. Press Enter, Space or tap to keep a selection; Escape returns to the latest observation.'}</p>}
    {showDataTable && (comparisonPoints
      ? <SeriesAlternative title={title} points={points} comparisonPoints={comparisonPoints} seriesLabel={currentLabel} comparisonLabel={previousLabel} unit={unit} locale={locale} />
      : <Alternative title={title} points={points} unit={unit} locale={locale} />)}
  </Frame>;
}

export function BarChart({ title, description, points, unit, locale = 'en', xAxisLabel, yAxisLabel, showDataTable = true }: Common & { points: readonly SeriesPoint[] }) {
  validatePoints(points);
  if (!points.some(point => point.value !== null)) return <Empty title={title} locale={locale} />;
  const scale = chartScale(points.map(point => point.value));
  const zero = chartPosition(0, domain(scale)) * 100;
  const ticks = [...new Set([scale.min, 0, scale.max])];
  return <Frame title={title} description={description}>
    <div className="kk-bars" data-chart="bar">
      {(yAxisLabel ?? unitLabel(unit, locale)) && <p className="kk-chart-caption">{yAxisLabel ?? unitLabel(unit, locale)}</p>}
      {points.map(point => {
        const interval = chartInterval(0, point.value, domain(scale));
        return <div key={point.key} className="kk-horizontal-bar" data-state={point.value === null ? 'missing' : point.value === 0 ? 'zero' : 'observed'}
          data-negative={point.value !== null && point.value < 0 || undefined} style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', fontSize: 12 }}>
            <span style={{ color: 'var(--kk-muted)', overflowWrap: 'anywhere' }}>{point.label}</span>
            <strong style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{valueText(point.value, unit, locale)}</strong>
          </div>
          <div className="kk-bar-track" aria-hidden="true" style={{ position: 'relative', height: 9, overflow: 'visible' }}>
            <span style={{ position: 'absolute', left: `${zero}%`, top: -3, bottom: -3, borderLeft: '1px solid var(--kk-line-strong)' }} />
            {interval && <i data-from={0} data-to={point.value} style={{ position: 'absolute', left: `${interval.start * 100}%`, width: `${interval.size * 100}%` }} />}
            {point.value === 0 && <span style={{ position: 'absolute', left: `${zero}%`, top: 0, bottom: 0, borderLeft: '2px solid var(--kk-accent)' }} />}
          </div>
        </div>;
      })}
      <div aria-hidden="true" className="kk-horizontal-axis" style={{ position: 'relative', height: 18, fontSize: 11, color: 'var(--kk-muted)' }}>
        {ticks.map(tick => <span key={tick} style={{ position: 'absolute', left: `${chartPosition(tick, domain(scale)) * 100}%`, transform: tick === scale.min ? 'none' : tick === scale.max ? 'translateX(-100%)' : 'translateX(-50%)' }}>{axisText(tick, unit, locale)}</span>)}
      </div>
      {xAxisLabel && <p className="kk-chart-caption" style={{ textAlign: 'center' }}>{xAxisLabel}</p>}
    </div>
    {showDataTable && <Alternative title={title} points={points} unit={unit} locale={locale} />}
  </Frame>;
}

export function VerticalBarChart({ title, description, points, unit, locale = 'en', xAxisLabel, yAxisLabel, showDataTable = true }: Common & { points: readonly SeriesPoint[] }) {
  validatePoints(points);
  if (!points.some(point => point.value !== null)) return <Empty title={title} locale={locale} />;
  const scale = chartScale(points.map(point => point.value));
  const band = innerWidth(plot) / points.length, width = Math.min(44, band * .56);
  const x = (index: number) => plot.left + (index + .5) * band;
  return <Frame title={title} description={description}>
    <Graphic title={title} summary={pointDescription(points, unit, locale)} kind="vertical-bar"
      valueAxisLabel={yAxisLabel ?? unitLabel(unit, locale)} categoryAxisLabel={xAxisLabel}>
      <ValueAxis scale={scale} unit={unit} locale={locale} />
      {points.map((point, index) => point.value === null ? <MissingMark key={point.key} x={x(index)} y={yPosition(0, scale)} />
        : <IntervalBar key={point.key} from={0} to={point.value} scale={scale} x={x(index) - width / 2} width={width} color={colors[0]}
          data-negative={point.value < 0 || undefined} label={`${point.label}: ${valueText(point.value, unit, locale)}`} />)}
      <CategoryLabels labels={points.map(point => point.label)} x={x} />
    </Graphic>
    {showDataTable && <Alternative title={title} points={points} unit={unit} locale={locale} />}
  </Frame>;
}

function MultiAlternative({ title, points, series, unit, locale }: { title: string; points: readonly MultiSeriesPoint[]; series: readonly ChartSeries[]; unit?: Unit; locale: KitLocale }) {
  return <details className="kk-data-alternative"><summary>{locale === 'ko' ? '데이터 표' : 'Data table'}</summary>
    <table aria-label={title}><thead><tr><th scope="col">{locale === 'ko' ? '항목' : 'Item'}</th>{series.map(item => <th scope="col" key={item.key}>{item.label}</th>)}</tr></thead>
      <tbody>{points.map(point => <tr key={point.key}><th scope="row">{point.label}</th>{series.map(item => <td key={item.key}>{valueText(point.values[item.key] ?? null, unit, locale)}</td>)}</tr>)}</tbody>
    </table></details>;
}

function MultiBarChart({ title, description, points, series, unit, locale = 'en', xAxisLabel, yAxisLabel, showDataTable = true, stacked }: Common & {
  points: readonly MultiSeriesPoint[]; series: readonly ChartSeries[]; stacked: boolean;
}) {
  const values = multiSeriesValues(points, series);
  const totals = stacked ? stackedTotals(points, series) : null;
  if (!values.some(value => value !== null)) return <Empty title={title} locale={locale} />;
  const scale = chartScale(totals ?? values);
  const band = innerWidth(plot) / points.length;
  const groupWidth = band * .7, width = stacked ? Math.min(44, groupWidth) : Math.min(30, groupWidth / series.length);
  const x = (index: number) => plot.left + (index + .5) * band;
  const partial = stacked && values.some(value => value === null);
  return <Frame title={title} description={description}>
    <Legend items={series.map((item, index) => ({ ...item, color: colors[index] }))} locale={locale} />
    <Graphic title={title} summary={`${observationSummary(values, locale)} ${points.map(point => `${point.label}: ${series.map(item => `${item.label} ${valueText(point.values[item.key] ?? null, unit, locale)}`).join(', ')}`).join('; ')}`} kind={stacked ? 'stacked-bar' : 'grouped-bar'}
      valueAxisLabel={yAxisLabel ?? unitLabel(unit, locale)} categoryAxisLabel={xAxisLabel}>
      <ValueAxis scale={scale} unit={unit} locale={locale} />
      {points.map((point, pointIndex) => {
        let current = 0;
        return <g key={point.key} data-category={point.key} data-partial={stacked && series.some(item => point.values[item.key] == null) || undefined}>
          {series.map((item, index) => {
            const value = point.values[item.key] ?? null;
            const barX = stacked ? x(pointIndex) - width / 2 : x(pointIndex) + (index - series.length / 2) * width;
            if (value === null) return stacked ? null : <MissingMark key={item.key} x={barX + width / 2} y={yPosition(0, scale)} />;
            const from = stacked ? current : 0;
            const to = stacked ? current + value : value;
            if (stacked) current = to;
            return <IntervalBar key={item.key} from={from} to={to} scale={scale} x={barX + (stacked ? 0 : 1)} width={stacked ? width : Math.max(1, width - 2)}
              color={colors[index]} data-series={item.key} data-negative={value < 0 || undefined} label={`${point.label}, ${item.label}: ${valueText(value, unit, locale)}`} />;
          })}
          {stacked && series.some(item => point.values[item.key] == null) && <text x={x(pointIndex)} y={yPosition(current, scale) - 8} textAnchor="middle" fill="var(--kk-muted)" data-state="missing">{locale === 'ko' ? '누락 포함' : 'Incomplete'}</text>}
        </g>;
      })}
      <CategoryLabels labels={points.map(point => point.label)} x={x} />
    </Graphic>
    {partial && <p className="kk-chart-caption">{locale === 'ko' ? '누락이 있는 항목은 관측값만 표시하며, 완전한 합계가 아닙니다.' : 'Incomplete categories show observed values only, not complete totals.'}</p>}
    {showDataTable && <MultiAlternative title={title} points={points} series={series} unit={unit} locale={locale} />}
  </Frame>;
}

export function GroupedBarChart(props: Common & { points: readonly MultiSeriesPoint[]; series: readonly ChartSeries[] }) {
  return <MultiBarChart {...props} stacked={false} />;
}

export function StackedBarChart(props: Common & { points: readonly MultiSeriesPoint[]; series: readonly ChartSeries[] }) {
  return <MultiBarChart {...props} stacked />;
}

export function WaterfallChart({ title, description, start, changes, unit, locale = 'en', xAxisLabel, yAxisLabel, showDataTable = true }: Common & { start: number; changes: readonly SeriesPoint[] }) {
  const result = waterfallSteps(start, changes);
  const steps = result.steps.map(step => ({ ...step, label: step.kind === 'start' ? (locale === 'ko' ? '시작' : 'Start') : step.kind === 'end' ? (locale === 'ko' ? '종료' : 'End') : step.label }));
  const scale = chartScale(steps.flatMap(step => [step.from, step.to]));
  const band = innerWidth(plot) / steps.length, width = Math.min(46, band * .58);
  const x = (index: number) => plot.left + (index + .5) * band;
  const reconciliation = result.complete ? `${valueText(start, unit, locale)} → ${valueText(result.end, unit, locale)}`
    : locale === 'ko' ? '누락된 변화 항목이 있어 기말값을 계산하지 않습니다.' : 'Closing value withheld because a movement is missing.';
  return <Frame title={title} description={description}>
    <Graphic title={title} summary={`${reconciliation} ${pointDescription(changes, unit, locale)}`} kind="waterfall" valueAxisLabel={yAxisLabel ?? unitLabel(unit, locale)} categoryAxisLabel={xAxisLabel}>
      <ValueAxis scale={scale} unit={unit} locale={locale} />
      {steps.map((step, index) => <g key={`${step.kind}:${step.key}`}>
        {index < steps.length - 1 && <line x1={x(index) + width / 2} x2={x(index + 1) - width / 2} y1={yPosition(step.to, scale)} y2={yPosition(step.to, scale)} stroke="var(--kk-line-strong)" strokeDasharray="3 3" />}
        <IntervalBar from={step.from} to={step.to} scale={scale} x={x(index) - width / 2} width={width}
          color={step.kind !== 'change' ? colors[1] : step.value < 0 ? colors[2] : colors[0]} data-kind={step.kind} data-negative={step.value < 0 || undefined}
          label={`${step.label}: ${valueText(step.value, unit, locale)}`} />
      </g>)}
      <CategoryLabels labels={steps.map(step => step.label)} x={x} />
    </Graphic>
    <p className="kk-chart-caption" data-complete={result.complete}>{reconciliation}</p>
    {showDataTable && <Alternative title={title} points={[
      { key: 'start', label: locale === 'ko' ? '시작' : 'Start', value: start },
      ...changes.map(change => ({ ...change, key: `change:${change.key}` })),
      { key: 'end', label: locale === 'ko' ? '종료' : 'End', value: result.end },
    ]} unit={unit} locale={locale} />}
  </Frame>;
}

export function DonutChart({ title, description, points, unit, locale = 'en', showDataTable = true }: Common & { points: readonly SeriesPoint[] }) {
  const { total, parts } = donutParts(points);
  const id = useId();
  if (!points.length) return <Empty title={title} locale={locale} />;
  let offset = 0;
  return <Frame title={title} description={description}>
    <div data-chart="donut" className="kk-donut-wrap">
      <svg viewBox="0 0 120 120" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <title id={`${id}-title`}>{title}</title><desc id={`${id}-description`}>{parts.map(part => `${part.label}: ${valueText(part.value, unit, locale)}`).join('; ')}</desc>
        <circle cx="60" cy="60" r="40" fill="none" stroke="var(--kk-surface-2)" strokeWidth="16" />
        {parts.map((part, index) => {
          const dash = part.fraction * 100;
          const circle = <circle key={part.key} className="kk-donut-part" cx="60" cy="60" r="40" pathLength="100"
            style={{ stroke: colors[index], opacity: 1 }} strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset} data-series={index}>
            <title>{`${part.label}: ${valueText(part.value, unit, locale)} (${new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(part.fraction)})`}</title>
          </circle>;
          offset += dash;
          return circle;
        })}
        <circle className="kk-donut-hole" cx="60" cy="60" r="28" />
      </svg>
      <div><strong className="kk-donut-total">{valueText(total, unit, locale)}</strong><span>{locale === 'ko' ? '합계' : 'Total'}</span></div>
    </div>
    <div style={{ marginTop: 18 }}><Legend items={parts.map((part, index) => ({ key: part.key, label: part.label, color: colors[index], value: valueText(part.value, unit, locale) }))} locale={locale} /></div>
    {showDataTable && <Alternative title={title} points={points} unit={unit} locale={locale} />}
  </Frame>;
}

export function BulletChart({ title, description, actual, target, unit, locale = 'en', xAxisLabel, yAxisLabel, showDataTable = true }: Common & { actual: number; target: number }) {
  if (![actual, target].every(value => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER))
    throw new RangeError('Bullet values must be safe, finite and nonnegative.');
  const max = Math.max(actual, target, 1) * 1.08;
  const actualLabel = locale === 'ko' ? '실제' : 'Actual', targetLabel = locale === 'ko' ? '목표' : 'Target';
  const summary = `${actualLabel} ${valueText(actual, unit, locale)} · ${targetLabel} ${valueText(target, unit, locale)}`;
  return <Frame title={title} description={description}>
    <div data-chart="bullet" className="kk-bullet">
      {(yAxisLabel ?? unitLabel(unit, locale)) && <p className="kk-chart-caption">{yAxisLabel ?? unitLabel(unit, locale)}</p>}
      <div className="kk-bullet-track" role="img" aria-label={summary}>
        <i style={{ width: `${actual / max * 100}%` }} /><b style={{ left: `${target / max * 100}%` }} />
      </div>
      <p className="kk-chart-caption">{summary}</p>
      {xAxisLabel && <p className="kk-chart-caption">{xAxisLabel}</p>}
    </div>
    {showDataTable && <Alternative title={title} points={[{ key: 'actual', label: actualLabel, value: actual }, { key: 'target', label: targetLabel, value: target }]} unit={unit} locale={locale} />}
  </Frame>;
}
