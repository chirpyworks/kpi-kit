import type { KitLocale, MetricPattern, MetricView, SeriesPoint } from '../kit/contracts.js';
import type { DashboardMeta, DashboardModel } from './dashboard-data.js';
import { buildDashboard, metricHistories } from './dashboard-data.js';
const json=(value:unknown)=>JSON.stringify(value,null,2);
const imports=(components:string)=>`import React from 'react';\nimport { ${components} } from './kit/index.js';\nimport './kit/styles.css';\n\n`;

export function metricSnippet(metric:MetricView|undefined,pattern:MetricPattern,locale:KitLocale,trend?:readonly SeriesPoint[]) {
  if(!metric)return stateSnippet(locale);
  const hasTrend=pattern==='sparkline'&&!!trend;
  return imports('MetricCard, validateMetricView')+`const metric = validateMetricView(${json(metric)});\n${hasTrend?`const trend = ${json(trend)};\n`:''}\nexport default function Example() {\n  return <div className="kk-root">\n    <MetricCard metric={metric} pattern="${pattern}" locale="${locale}"${hasTrend?' trend={trend}':''} />\n  </div>;\n}\n`;
}
function tableData(model:DashboardModel) {
  // Serialize display values through the exact column adapters. Raw money is in cents;
  // labels such as USD must never be paired with those raw cents in a copied example.
  const rows=model.rows.map(row=>({id:row.id,...Object.fromEntries(model.columns.map(col=>[col.id,col.value(row)]))}));
  return `const rows: Array<{ id: string; [key: string]: string | number | null }> = ${json(rows)};\nconst columns = [\n${model.columns.map(col=>`  { id: ${json(col.id)}, label: ${json(col.label)}, value: (row: typeof rows[number]) => row[${json(col.id)}]${col.align?`, align: '${col.align}' as const`:''} },`).join('\n')}\n];\n`;
}
const tableJsx=(model:DashboardModel,locale:KitLocale)=>`<DataTable title=${json(model.tableTitle)} rows={rows}\n      columns={columns} getRowId={row => row.id} locale="${locale}" selectable />`;
export function tableSnippet(model:DashboardModel,locale:KitLocale) {
  return imports('DataTable')+tableData(model)+`\nexport default function Example() {\n  return <div className="kk-root">${tableJsx(model,locale)}</div>;\n}\n`;
}
export function dashboardSnippet(model:DashboardModel,meta:DashboardMeta,locale:KitLocale) {
  if(model.status!=='ready')return imports('StatePanel')+`export default function Example() {\n  return <div className="kk-root"><StatePanel title=${json(meta.title)} message=${json(model.message)} kind="${model.status==='invalid'?'error':'empty'}" /></div>;\n}\n`;
  return imports('MetricCard, SeriesChart, BarChart, DataTable, StatePanel, validateMetricDataset')+`// Synthetic snapshot, recomputed from one date-filtered source.\nconst dataset = validateMetricDataset(${json({schemaVersion:1,name:meta.title,isSample:true,metrics:model.metrics})});\nconst trend = ${json(model.trend)};\nconst histories = ${json(metricHistories(model,locale))};\nconst comparison = ${json(model.previousAvailable&&model.previousRange?buildDashboard(model.kind,model.previousRange,locale).trend:undefined)??'undefined'};\nconst categories = ${json(model.categories)};\n${tableData(model)}\nexport default function Example() {\n  return <main className="kk-root" style={{ padding: 24 }}>\n    <h1>${meta.title}</h1>\n    <p>${model.range.start} — ${model.range.end} · ${model.sourceLabel}</p>\n${model.coverage!=='complete'||!model.previousAvailable?`    <StatePanel kind="partial" title=${json(locale==='ko'?'데이터 범위 안내':'Coverage note')} message=${json(model.message)} />\n`:''}    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))'}}>\n      {dataset.metrics.map((metric, index) => <MetricCard key={metric.definition.id} metric={metric} pattern="comparison" trend={histories[metric.definition.id as keyof typeof histories]} trendPlacement="inline" locale="${locale}" />)}\n    </section>\n    <SeriesChart title=${json(model.trendTitle)} points={trend} comparisonPoints={comparison} seriesLabel=${json(locale==='ko'?'현재 기간':'Current period')} comparisonLabel=${json(locale==='ko'?'이전 기간':'Previous period')} density="compact" maxHeight={216} interactive area\n      unit={{kind:'number',label:${json(model.trendUnit)}}} yAxisLabel=${json(model.trendUnit)} locale="${locale}" />\n    <BarChart title=${json(model.categoriesTitle)} points={categories}\n      unit={{kind:'number',label:${json(model.categoriesUnit)}}} locale="${locale}" />\n    ${tableJsx(model,locale)}\n  </main>;\n}\n`;
}
export function stateSnippet(locale:KitLocale) {
  const ko=locale==='ko';
  return imports('StatePanel')+`export default function Example() {\n  return <div className="kk-root">\n    <StatePanel kind="partial" title=${json(ko?'일부 데이터':'Partial coverage')}\n      message=${json(ko?'관측된 값만 표시하며 완전한 합계로 간주하지 않습니다.':'Show observed values; do not imply a complete total.')} />\n  </div>;\n}\n`;
}
