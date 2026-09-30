import type { ChartSeries, KitLocale, MultiSeriesPoint, SeriesPoint } from '../kit/contracts.js';

export type ChartKind = 'line' | 'area' | 'hbar' | 'vbar' | 'grouped' | 'stacked' | 'waterfall' | 'donut' | 'bullet';
export const chartKinds: ChartKind[] = ['line', 'area', 'hbar', 'vbar', 'grouped', 'stacked', 'waterfall', 'donut', 'bullet'];
export function chartExamples(locale: KitLocale) {
  const ko = locale === 'ko';
  const names: Record<ChartKind, string> = ko
    ? { line: '선 차트', area: '영역 차트', hbar: '가로 막대', vbar: '세로 막대', grouped: '그룹 막대', stacked: '누적 막대', waterfall: '워터폴', donut: '도넛', bullet: '불릿' }
    : { line: 'Line', area: 'Area', hbar: 'Horizontal bar', vbar: 'Vertical bar', grouped: 'Grouped bar', stacked: 'Stacked bar', waterfall: 'Waterfall', donut: 'Donut', bullet: 'Bullet' };
  const trend: SeriesPoint[] = [142,181,168,null,206,231,219].map((value,i) => ({key:String(i),label:ko?`9/${i+1}`:`Sep ${i+1}`,value}));
  const categories: SeriesPoint[] = [428,361,204,137].map((value,i) => ({key:String(i),label:(ko?['검색','직접 방문','추천','소셜']:['Search','Direct','Referral','Social'])[i],value}));
  const series: ChartSeries[] = [{key:'current',label:ko?'현재':'Current'},{key:'previous',label:ko?'이전':'Previous'}];
  const multi: MultiSeriesPoint[] = [[42,31],[-18,24],[0,-12],[36,28]].map(([current,previous],i)=>({key:String(i),label:`Q${i+1}`,values:{current,previous}}));
  const stacked = multi.map((p,i)=>({...p,values:{current:[42,18,26,36][i],previous:[31,24,12,28][i]}}));
  const changes: SeriesPoint[] = [42,18,0,-12,-24].map((value,i)=>({key:String(i),label:(ko?['신규','확장','조정','축소','이탈']:['New','Expansion','Adjustment','Contraction','Churn'])[i],value}));
  return {names,trend,categories,series,multi,stacked,changes};
}
const componentNames: Record<ChartKind,string> = {line:'SeriesChart',area:'SeriesChart',hbar:'BarChart',vbar:'VerticalBarChart',grouped:'GroupedBarChart',stacked:'StackedBarChart',waterfall:'WaterfallChart',donut:'DonutChart',bullet:'BulletChart'};
/** Complete TSX modules: paste alongside a copied src/kit directory. */
export function chartSnippet(kind: ChartKind, locale: KitLocale) {
  const data=chartExamples(locale), component=componentNames[kind];
  let declarations=''; let props='';
  if(kind==='line'||kind==='area') { declarations=`const points = ${JSON.stringify(data.trend,null,2)};`; props=`points={points}${kind==='area'?' area':''} unit={{kind:'count'}} yAxisLabel="${locale==='ko'?'가입 수':'Signups'}" xAxisLabel="${locale==='ko'?'날짜 · 2026년 9월':'Date · September 2026'}"`; }
  else if(kind==='hbar'||kind==='vbar'||kind==='donut') { declarations=`const points = ${JSON.stringify(data.categories,null,2)};`; props="points={points} unit={{kind:'count'}}"; }
  else if(kind==='grouped'||kind==='stacked') { declarations=`const points = ${JSON.stringify(kind==='grouped'?data.multi:data.stacked,null,2)};\nconst series = ${JSON.stringify(data.series,null,2)};`; props=kind==='stacked'?"points={points} series={series} unit={{kind:'count'}}":`points={points} series={series} yAxisLabel="${locale==='ko'?'증감 수':'Net change'}"`; }
  else if(kind==='waterfall') { declarations=`const changes = ${JSON.stringify(data.changes,null,2)};`; props=`start={184} changes={changes} yAxisLabel="${locale==='ko'?'계정 수':'Accounts'}"`; }
  else props="actual={97.3} target={98} unit={{kind:'number',label:'%'}}";
  return `import React from 'react';\nimport { ${component} } from './kit/index.js';\nimport './kit/styles.css';\n\n${declarations}\n\nexport default function Example() {\n  return (\n    <div className="kk-root">\n      <${component}\n        title=${JSON.stringify(data.names[kind])}\n        locale="${locale}"\n        ${props}\n      />\n    </div>\n  );\n}\n`;
}
