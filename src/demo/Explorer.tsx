import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ChartSeries, KitLocale, MetricDataset, MetricPattern, MultiSeriesPoint, SeriesPoint } from '../kit/contracts.js';
import { parseMetricDataset } from '../kit/core/validate.js';
import {
  BarChart, BulletChart, Button, Checkbox, DataTable, DateRangeField, Dialog, DonutChart,
  FilterChip, GroupedBarChart, MetricCard, SeriesChart, StackedBarChart, StatePanel, Switch,
  Tabs, Tooltip, VerticalBarChart, WaterfallChart
} from '../kit/index.js';
import type { DataColumn } from '../kit/core/table.js';
import '../kit/styles.css';
import './explorer.css';

type ChartKind='line'|'area'|'hbar'|'vbar'|'grouped'|'stacked'|'waterfall'|'donut'|'bullet';
type Section='overview'|'metrics'|'charts'|'table'|'states'|'code';
const patterns: MetricPattern[]=['number','comparison','sparkline','target','status','compact'];
const chartKinds: ChartKind[]=['line','area','hbar','vbar','grouped','stacked','waterfall','donut','bullet'];
const chartNames: Record<ChartKind,string>={line:'Line',area:'Area',hbar:'Horizontal bar',vbar:'Vertical bar',grouped:'Grouped bar',stacked:'Stacked bar',waterfall:'Waterfall',donut:'Donut',bullet:'Bullet'};

const trend: SeriesPoint[]=[
  {key:'m',label:'Mon',value:142},{key:'t',label:'Tue',value:181},{key:'w',label:'Wed',value:168},
  {key:'th',label:'Thu',value:null},{key:'f',label:'Fri',value:206},{key:'sa',label:'Sat',value:231},{key:'su',label:'Sun',value:219},
];
const categories: SeriesPoint[]=[
  {key:'direct',label:'Direct',value:428},{key:'search',label:'Search',value:361},{key:'social',label:'Social',value:204},{key:'referral',label:'Referral',value:137}
];
const series: ChartSeries[]=[{key:'current',label:'Current'},{key:'previous',label:'Previous'}];
const multi: MultiSeriesPoint[]=[
  {key:'mon',label:'Mon',values:{current:142,previous:121}},{key:'tue',label:'Tue',values:{current:181,previous:154}},
  {key:'wed',label:'Wed',values:{current:168,previous:160}},{key:'thu',label:'Thu',values:{current:195,previous:172}},
  {key:'fri',label:'Fri',values:{current:206,previous:188}},
];
const waterfall: SeriesPoint[]=[
  {key:'new',label:'New',value:42},{key:'expansion',label:'Expansion',value:18},{key:'contraction',label:'Contraction',value:-12},{key:'churn',label:'Churn',value:-24},
];

type Row={id:string; channel:string; sessions:number; conversions:number; rate:number; status:string};
const rows: Row[]=[
  {id:'r1',channel:'Organic search',sessions:1840,conversions:136,rate:7.39,status:'Healthy'},
  {id:'r2',channel:'Direct',sessions:1510,conversions:121,rate:8.01,status:'Healthy'},
  {id:'r3',channel:'Paid search',sessions:922,conversions:48,rate:5.21,status:'Watch'},
  {id:'r4',channel:'Referral',sessions:601,conversions:51,rate:8.49,status:'Healthy'},
  {id:'r5',channel:'Social',sessions:488,conversions:19,rate:3.89,status:'Watch'},
  {id:'r6',channel:'Email',sessions:319,conversions:36,rate:11.29,status:'Healthy'},
  {id:'r7',channel:'Partners',sessions:206,conversions:17,rate:8.25,status:'Healthy'},
];
const columns: DataColumn<Row>[]=[
  {id:'channel',label:'Channel',value:r=>r.channel},
  {id:'sessions',label:'Sessions',value:r=>r.sessions,align:'end'},
  {id:'conversions',label:'Conversions',value:r=>r.conversions,align:'end'},
  {id:'rate',label:'Rate %',value:r=>r.rate,align:'end'},
  {id:'status',label:'Status',value:r=>r.status},
];

function MetricPreview({dataset,pattern,locale}:{dataset:MetricDataset;pattern:MetricPattern;locale:KitLocale}){
  const metric=pattern==='target'
    ? dataset.metrics.find(m=>m.definition.target) ?? dataset.metrics[0]
    : pattern==='status'
      ? {...dataset.metrics[0],current:{...dataset.metrics[0].current,quality:{coverage:'partial' as const,freshness:'stale' as const,reasons:['Synthetic partial-coverage state']}}}
      : dataset.metrics[patterns.indexOf(pattern)%dataset.metrics.length];
  const spark=pattern==='sparkline'?trend:undefined;
  return <MetricCard metric={metric} pattern={pattern} trend={spark} locale={locale}/>;
}

function ChartPreview({kind,locale}:{kind:ChartKind;locale:KitLocale}){
  const common={locale,title:chartNames[kind]+' example'};
  if(kind==='line') return <SeriesChart {...common} points={trend}/>;
  if(kind==='area') return <SeriesChart {...common} points={trend} area/>;
  if(kind==='hbar') return <BarChart {...common} points={categories}/>;
  if(kind==='vbar') return <VerticalBarChart {...common} points={categories}/>;
  if(kind==='grouped') return <GroupedBarChart {...common} points={multi} series={series}/>;
  if(kind==='stacked') return <StackedBarChart {...common} points={multi.map(p=>({...p,values:{current:Math.abs(p.values.current??0),previous:Math.abs(p.values.previous??0)}}))} series={series}/>;
  if(kind==='waterfall') return <WaterfallChart {...common} start={184} changes={waterfall}/>;
  if(kind==='donut') return <DonutChart {...common} points={categories}/>;
  return <BulletChart {...common} actual={97.3} target={98}/>;
}

const snippets={
  metric:`import { MetricCard, validateMetricView } from './kit/index.js';\nimport './kit/styles.css';\n\nconst metric = validateMetricView(rawMetric);\n\n<MetricCard metric={metric} pattern="comparison" />`,
  chart:`import { SeriesChart } from './kit/index.js';\n\n<SeriesChart\n  title="Weekly signups"\n  points={[\n    { key: 'mon', label: 'Mon', value: 142 },\n    { key: 'tue', label: 'Tue', value: 181 },\n    { key: 'wed', label: 'Wed', value: null },\n  ]}\n/>`,
  table:`<DataTable\n  title="Acquisition channels"\n  rows={rows}\n  columns={columns}\n  getRowId={row => row.id}\n  selectable\n/>`
};

export function Explorer(){
  const [locale,setLocale]=useState<KitLocale>('en');
  const [theme,setTheme]=useState<'light'|'dark'>('light');
  const [section,setSection]=useState<Section>('overview');
  const [dataset,setDataset]=useState<MetricDataset|null>(null);
  const [loadError,setLoadError]=useState('');
  const [pattern,setPattern]=useState<MetricPattern>('comparison');
  const [chart,setChart]=useState<ChartKind>('line');
  const [dateRange,setDateRange]=useState({start:'2026-09-01',end:'2026-09-07'});
  const [alerts,setAlerts]=useState(true);
  const [dialogOpen,setDialogOpen]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{ fetch('./examples/metrics.json').then(r=>{if(!r.ok)throw new Error('Sample data unavailable');return r.text()}).then(t=>setDataset(parseMetricDataset(t))).catch(e=>setLoadError(e instanceof Error?e.message:'Sample data unavailable')); },[]);

  const labels=locale==='ko'?{
    eyebrow:'OPEN-SOURCE REACT KPI KIT', title:'대시보드의 숫자를 더 정확하게, 더 빠르게 조립하세요.',
    deck:'KPI·차트·테이블·상태를 하나의 의미 체계로 묶은 소스 키트입니다. 샘플 데이터는 합성이며 계정이나 API 키가 필요 없습니다.',
    overview:'Overview',metrics:'KPI patterns',charts:'Charts',table:'Table',states:'States',code:'Code',
    import:'KPI JSON 가져오기',theme:'다크 모드',sample:'합성 샘플',signal:'이번 주 핵심 신호',trend:'가입 추세',channels:'유입 채널',
    inspect:'부품을 선택하면 실제 렌더와 데이터/코드 계약을 함께 볼 수 있습니다.', components:'Component workbench',
  }:{
    eyebrow:'OPEN-SOURCE REACT KPI KIT',title:'Compose dashboards faster without losing the meaning of the numbers.',
    deck:'A source kit for KPI patterns, charts, tables and states that share one explicit data contract. Synthetic sample data; no account or API key.',
    overview:'Overview',metrics:'KPI patterns',charts:'Charts',table:'Table',states:'States',code:'Code',
    import:'Import KPI JSON',theme:'Dark mode',sample:'Synthetic sample',signal:'Signals this week',trend:'Signup trend',channels:'Acquisition channels',
    inspect:'Select a component to inspect its actual render, data behavior and usage shape.',components:'Component workbench',
  };

  async function importFile(file:File){
    if(file.size>5*1024*1024){setLoadError('File exceeds 5 MiB.');return;}
    try{const next=parseMetricDataset(await file.text());setDataset(next);setLoadError('');}
    catch(e){setLoadError(e instanceof Error?e.message:'Invalid dataset');}
    finally{if(fileRef.current)fileRef.current.value='';}
  }

  const primary=dataset?.metrics.slice(0,4)??[];
  const tabs=[['overview',labels.overview],['metrics',labels.metrics],['charts',labels.charts],['table',labels.table],['states',labels.states],['code',labels.code]] as const;

  return <div className="kk-root kk-demo" data-theme={theme}>
    <header className="demo-topbar">
      <a className="demo-brand" href="./index.html" aria-label="KPI Kit home"><span>K</span><b>KPI KIT</b></a>
      <div className="demo-top-actions">
        <span className="demo-sample">{labels.sample}</span>
        <Button variant="quiet" onClick={()=>setLocale(locale==='en'?'ko':'en')}>{locale==='en'?'한국어':'EN'}</Button>
        <Switch checked={theme==='dark'} onCheckedChange={v=>setTheme(v?'dark':'light')} label={labels.theme}/>
        <Button onClick={()=>fileRef.current?.click()}>{labels.import}</Button>
        <input ref={fileRef} className="kk-sr-only" type="file" accept="application/json,.json" onChange={e=>{const f=e.target.files?.[0];if(f)void importFile(f)}}/>
      </div>
    </header>

    <main className="demo-shell">
      <section className="demo-hero">
        <div><p className="demo-eyebrow">{labels.eyebrow}</p><h1>{labels.title}</h1><p className="demo-deck">{labels.deck}</p></div>
        <div className="demo-meta"><span>React + TypeScript</span><span>MIT</span><span>Local-first examples</span></div>
      </section>

      <nav className="demo-nav" aria-label="Explorer sections">
        {tabs.map(([value,label])=><button key={value} type="button" aria-current={section===value?'page':undefined} onClick={()=>setSection(value)}>{label}</button>)}
      </nav>

      {loadError && <div className="demo-error" role="alert">{loadError}</div>}

      {section==='overview' && <>
        <section className="demo-section-head"><div><p>01</p><h2>{labels.signal}</h2></div><span>{dateRange.start} → {dateRange.end}</span></section>
        <section className="demo-kpi-ribbon">{dataset ? primary.map((m,i)=><MetricCard key={m.definition.id} metric={m} pattern={i===3?'target':'comparison'} locale={locale}/>) : <StatePanel kind="loading" title="Loading sample" message="Reading the checked-in synthetic dataset." />}</section>
        <section className="demo-analysis-grid">
          <div><SeriesChart title={labels.trend} points={trend} area locale={locale}/></div>
          <div><BarChart title={labels.channels} points={categories} locale={locale}/></div>
        </section>
        <section className="demo-detail-row">
          <DateRangeField {...dateRange} onChange={setDateRange} startLabel={locale==='ko'?'시작':'Start'} endLabel={locale==='ko'?'종료':'End'}/>
          <div className="demo-note"><strong>{locale==='ko'?'의미를 숨기지 않습니다':'Meaning stays visible'}</strong><p>{locale==='ko'?'누락은 0이 아니며, 목표 달성과 이전 대비 개선은 서로 다른 상태입니다.':'Missing is not zero, and target attainment is not the same thing as improvement versus a previous period.'}</p></div>
        </section>
        <DataTable title={labels.channels} rows={rows} columns={columns} getRowId={r=>r.id} selectable locale={locale}/>
      </>}

      {section==='metrics' && <section className="demo-workbench">
        <aside><p>02</p><h2>{labels.metrics}</h2><p>{labels.inspect}</p><div className="demo-choice-list">{patterns.map(p=><button key={p} type="button" aria-pressed={pattern===p} onClick={()=>setPattern(p)}><span>{p}</span><small>{p==='target'?'threshold':'metric view'}</small></button>)}</div></aside>
        <div className="demo-specimen">{dataset ? <MetricPreview dataset={dataset} pattern={pattern} locale={locale}/> : <StatePanel kind="loading" title="Loading" message="Synthetic metric data"/>}<pre><code>{snippets.metric.replace('comparison',pattern)}</code></pre></div>
      </section>}

      {section==='charts' && <section className="demo-workbench">
        <aside><p>03</p><h2>{labels.charts}</h2><p>{labels.inspect}</p><div className="demo-choice-list">{chartKinds.map(k=><button key={k} type="button" aria-pressed={chart===k} onClick={()=>setChart(k)}><span>{chartNames[k]}</span><small>{['line','area'].includes(k)?'trend':'comparison'}</small></button>)}</div></aside>
        <div className="demo-specimen"><ChartPreview kind={chart} locale={locale}/><pre><code>{snippets.chart}</code></pre></div>
      </section>}

      {section==='table' && <section className="demo-wide"><div className="demo-section-head"><div><p>04</p><h2>{labels.table}</h2></div><span>search · sort · select · CSV</span></div><DataTable title={labels.channels} rows={rows} columns={columns} getRowId={r=>r.id} selectable locale={locale}/><pre><code>{snippets.table}</code></pre></section>}

      {section==='states' && <section className="demo-wide">
        <div className="demo-section-head"><div><p>05</p><h2>{labels.states}</h2></div><span>loading · empty · error · partial · stale</span></div>
        <div className="demo-state-grid"><StatePanel kind="loading" title="Loading" message="Keep the current scope visible while data arrives."/><StatePanel title="Empty" message="A valid query returned no rows."/><StatePanel kind="error" title="Could not load data" message="Preserve the previous valid state and offer a retry."/><StatePanel kind="partial" title="Partial coverage" message="Show observed values without pretending the period is complete."/><StatePanel kind="stale" title="Stale data" message="Freshness and completeness are separate signals."/></div>
        <div className="demo-controls">
          <Checkbox label="Email digest" description="Native checkbox with visible label"/>
          <Switch checked={alerts} onCheckedChange={setAlerts} label="Anomaly alerts" description="Controlled switch"/>
          <div className="demo-chip-row"><FilterChip pressed>All</FilterChip><FilterChip pressed={false}>Healthy</FilterChip><FilterChip pressed={false}>Watch</FilterChip></div>
          <Tabs value="week" onChange={()=>{}} label="Period" items={[{value:'day',label:'Day'},{value:'week',label:'Week'},{value:'month',label:'Month'}]}/>
          <Tooltip label="Supplemental help, never the only label"><Button variant="quiet">?</Button></Tooltip>
          <Button variant="primary" onClick={()=>setDialogOpen(true)}>Open dialog</Button>
        </div>
        <Dialog open={dialogOpen} onClose={()=>setDialogOpen(false)} title="Native dialog"><p>Focus containment and Escape behavior come from the platform dialog element.</p></Dialog>
      </section>}

      {section==='code' && <section className="demo-wide"><div className="demo-section-head"><div><p>06</p><h2>{labels.code}</h2></div><span>src/kit/</span></div>
        <div className="demo-code-grid"><div><h3>Metric</h3><pre><code>{snippets.metric}</code></pre></div><div><h3>Chart</h3><pre><code>{snippets.chart}</code></pre></div><div><h3>Table</h3><pre><code>{snippets.table}</code></pre></div></div>
      </section>}
    </main>
    <footer className="demo-footer"><span>KPI Kit · 0.1.0-alpha.5</span><span>MIT · CHIRPYWORKS</span></footer>
  </div>;
}
