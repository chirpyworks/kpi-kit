import React, { useId, useMemo, useRef, useState } from 'react';
import type { KitLocale, MetricDataset, MetricPattern, MetricView } from '../kit/contracts.js';
import { parseMetricDataset } from '../kit/core/validate.js';
import {
  BarChart, BulletChart, Button, DataTable, DateRangeField, DonutChart,
  GroupedBarChart, MetricCard, SeriesChart, StackedBarChart, StatePanel, Switch,
  Tabs, VerticalBarChart, WaterfallChart
} from '../kit/index.js';
import { DashboardPreview } from './DashboardPreview.js';
import { AVAILABLE_RANGE, INITIAL_RANGE, buildDashboard, dashboardMeta } from './dashboard-data.js';
import type { DashboardKind, DateRange } from './dashboard-data.js';
import { chartExamples, chartKinds, chartSnippet } from './chart-examples.js';
import { metricSnippet, tableSnippet, dashboardSnippet } from './example-code.js';
import type { ChartKind } from './chart-examples.js';
import { isStudioSection, StudioPreview, studioDefaults, studioExamples, studioSnippet } from './studio-catalog.js';
import type { StudioSection } from './studio-catalog.js';
import '../kit/styles.css';
import './explorer.css';

type Section = 'dashboard' | 'metrics' | 'charts' | 'table' | StudioSection;
type Inspector = 'options' | 'data' | 'code';
type MobilePanel = 'library' | 'preview' | 'inspect';
const patterns: MetricPattern[] = ['number', 'comparison', 'sparkline', 'target', 'status', 'compact'];

function Icon({name}:{name:string}) {
  const paths: Record<string,React.ReactNode> = {
    revenue: <><path d="M3 15l5-5 4 3 8-9"/><path d="M14 4h6v6"/><path d="M3 20h18"/></>,
    customers: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 20v-3a6 6 0 0 0-4-5"/></>,
    operations: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
    metrics: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h4M7 15h10"/></>,
    charts: <><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/></>,
    states: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16h.01"/></>,
    navigation: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11"/></>,
    controls: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/></>,
    pages: <><path d="M6 3h8l4 4v14H6zM14 3v5h5M10 12h4M10 16h4"/></>,
    code: <><path d="M8 6l-6 6 6 6M16 6l6 6-6 6M14 3l-4 18"/></>,
  };
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]??paths.metrics}</svg>;
}
function ChartPreview({kind,locale}:{kind:ChartKind;locale:KitLocale}) {
  const d=chartExamples(locale), common={locale,title:d.names[kind]}, count={kind:'count' as const};
  if(kind==='line'||kind==='area') return <SeriesChart {...common} points={d.trend} area={kind==='area'} unit={count} yAxisLabel={locale==='ko'?'가입 수':'Signups'} xAxisLabel={locale==='ko'?'날짜 · 2026년 9월':'Date · September 2026'}/>;
  if(kind==='hbar') return <BarChart {...common} points={d.categories} unit={count}/>;
  if(kind==='vbar') return <VerticalBarChart {...common} points={d.categories} unit={count}/>;
  if(kind==='grouped') return <GroupedBarChart {...common} points={d.multi} series={d.series} yAxisLabel={locale==='ko'?'증감 수':'Net change'}/>;
  if(kind==='stacked') return <StackedBarChart {...common} points={d.stacked} series={d.series} unit={count}/>;
  if(kind==='waterfall') return <WaterfallChart {...common} start={184} changes={d.changes} yAxisLabel={locale==='ko'?'계정 수':'Accounts'}/>;
  if(kind==='donut') return <DonutChart {...common} points={d.categories} unit={count}/>;
  return <BulletChart {...common} actual={97.3} target={98} unit={{kind:'number',label:'%'}}/>;
}

export function Explorer() {
  const [locale,setLocale]=useState<KitLocale>('en');
  const [theme,setTheme]=useState<'light'|'dark'>('dark');
  const [section,setSection]=useState<Section>('dashboard');
  const [dashboard,setDashboard]=useState<DashboardKind>('revenue');
  const [inspector,setInspector]=useState<Inspector>('options');
  const [inspectorOpen,setInspectorOpen]=useState(false);
  const [mobile,setMobile]=useState<MobilePanel>('preview');
  const [range,setRange]=useState<DateRange>(INITIAL_RANGE);
  const [pattern,setPattern]=useState<MetricPattern>('comparison');
  const [chart,setChart]=useState<ChartKind>('line');
  const [imported,setImported]=useState<MetricDataset|null>(null);
  const [metricId,setMetricId]=useState('');
  const [importError,setImportError]=useState('');
  const [copyStatus,setCopyStatus]=useState('');
  const [studioSelection,setStudioSelection]=useState<Record<StudioSection,string>>(studioDefaults);
  const fileRef=useRef<HTMLInputElement>(null);
  const metricLabelId=useId(), exampleLabelId=useId();
  const ko=locale==='ko';
  const t=(en:string,kr:string)=>ko?kr:en;
  const model=useMemo(()=>buildDashboard(dashboard,range,locale),[dashboard,range,locale]);
  const componentModel=useMemo(()=>buildDashboard('revenue',INITIAL_RANGE,locale),[locale]);
  const meta=dashboardMeta(locale), activeMeta=meta.find(m=>m.kind===dashboard)!;
  const names=chartExamples(locale).names;
  const patternNames:Record<MetricPattern,string>=ko?{number:'숫자',comparison:'비교',sparkline:'미니 추세',target:'목표',status:'데이터 상태',compact:'간결형'}:{number:'Number',comparison:'Comparison',sparkline:'Sparkline',target:'Target',status:'Data quality',compact:'Compact'};
  const sectionNames:Record<Section,string>={dashboard:activeMeta.title,metrics:t('KPI patterns','KPI 패턴'),charts:t('Charts','차트'),table:t('Data table','데이터 테이블'),navigation:t('Navigation & layout','탐색·화면 구조'),controls:t('Forms & feedback','입력·피드백'),states:t('Data states','데이터 상태'),pages:t('Error pages','오류 페이지')};
  const activeExamples=isStudioSection(section)?studioExamples(section,locale):[];
  const activeExample=isStudioSection(section)?activeExamples.find(e=>e.id===studioSelection[section])??activeExamples[0]:undefined;
  const metrics=imported?.metrics??componentModel.metrics;
  const baseMetric=(imported?metrics.find(m=>m.definition.id===metricId):pattern==='target'?metrics.find(m=>m.definition.target):metrics[0])??metrics[0];
  const selectedMetric:MetricView|undefined=baseMetric&&pattern==='status'?{...baseMetric,current:{...baseMetric.current,quality:{coverage:'partial',freshness:'stale',reasons:[t('Synthetic partial-coverage example','합성 데이터의 일부 관측 예제')]}}}:baseMetric;
  const tableModel=section==='dashboard'?model:componentModel;
  const metricTrend=imported?undefined:componentModel.trend.map(p=>({...p,value:p.value===null?null:Math.round(p.value*100)}));
  const code=isStudioSection(section)&&activeExample?studioSnippet(section,activeExample.id,locale):section==='charts'?chartSnippet(chart,locale):section==='metrics'?metricSnippet(selectedMetric,pattern,locale,metricTrend):section==='table'?tableSnippet(tableModel,locale):dashboardSnippet(model,activeMeta,locale);
  const rawData=isStudioSection(section)&&activeExample?{category:section,example:activeExample.id,purpose:activeExample.description,persistence:locale==='ko'?'컴포넌트 로컬 상태만 사용':'Component-local state only',network:locale==='ko'?'요청·권한 변경·실제 서비스 연결 없음':'No requests, permission changes or live service connection'}:section==='charts'?chartExamples(locale):section==='metrics'?selectedMetric:{range:tableModel.range,previousRange:tableModel.previousRange,metrics:tableModel.metrics,rows:tableModel.rows};

  function selectSection(next:Section,kind?:DashboardKind) {setSection(next);setInspectorOpen(next==='metrics'||next==='charts');if(kind)setDashboard(kind);setMobile('preview');setCopyStatus('');}
  function inspectCode() {setInspectorOpen(true);setInspector('code');setMobile('inspect');setCopyStatus('');}
  async function copyCode() {try {await navigator.clipboard.writeText(code);setCopyStatus(t('Code copied','코드를 복사했습니다'));}catch{setCopyStatus(t('Select and copy the code below.','아래 코드를 선택해 복사하세요.'));}}
  async function importFile(file:File) {
    try {if(file.size>5*1024*1024)throw new Error(t('Maximum file size is 5 MiB.','파일은 5 MiB 이하여야 합니다.'));const next=parseMetricDataset(await file.text());setImported(next);setMetricId(next.metrics[0]?.definition.id??'');setImportError('');selectSection('metrics');}
    catch(e){setMobile('preview');setImportError(t('Could not import this dataset. Check the metric contract.','데이터를 가져오지 못했습니다. KPI 데이터 계약을 확인하세요.')+' '+(e instanceof Error?e.message:''));}
    finally{if(fileRef.current)fileRef.current.value='';}
  }

  return <div className="kk-root kk-demo" data-theme={theme} data-mobile-panel={mobile} lang={locale}>
    <header className="demo-topbar">
      <button type="button" className="demo-brand" onClick={()=>selectSection('dashboard','revenue')} aria-label={t('KPI Kit home','KPI Kit 홈')}><span aria-hidden="true">K<span>•</span></span><b>KPI KIT</b></button>
      <div className="demo-product-label">{t('Dashboard workbench','대시보드 워크벤치')}<span>α.5</span></div><nav className="demo-mode-switch" aria-label={t('Workbench mode','작업 모드')}><button aria-pressed={section==='dashboard'} onClick={()=>selectSection('dashboard')}>{t('Templates','템플릿')}</button><button aria-pressed={section!=='dashboard'} onClick={()=>selectSection('metrics')}>{t('Components','컴포넌트')}</button></nav>
      <div className="demo-top-actions"><a className="demo-source-link" href="https://github.com/chirpyworks/kpi-kit" target="_blank" rel="noreferrer">GitHub ↗</a><Button variant="quiet" onClick={()=>setLocale(ko?'en':'ko')}>{ko?'English':'한국어'}</Button><Switch checked={theme==='dark'} onCheckedChange={v=>setTheme(v?'dark':'light')} label={t('Dark mode','다크 모드')}/></div>
    </header>
    <div className="demo-mobile-tabs"><Tabs value={mobile} onChange={setMobile} label={t('Workbench panels','워크벤치 패널')} items={[{value:'library',label:t('Library','라이브러리')},{value:'preview',label:t('Preview','미리보기')},{value:'inspect',label:t('Inspector','설정·코드')}]}/></div>
    <div className="demo-workspace" data-inspector-open={inspectorOpen} data-mode={section==='dashboard'?'templates':'components'}>
      <aside className="demo-library" aria-label={t('Component library','컴포넌트 라이브러리')}>
        <div className="demo-library-intro"><span className="demo-eyebrow">{t('BUILD WITH MEANING','의미 있는 대시보드')}</span><p>{t('Components for clearer decisions.','선명한 판단을 만드는 컴포넌트.')}</p></div>
        <nav aria-label={t('Templates','템플릿')}><div className="demo-nav-label">{t('Composed dashboards','조합형 대시보드')}<span>03</span></div>{meta.map((m,i)=><button className="demo-nav-item" type="button" key={m.kind} aria-current={section==='dashboard'&&dashboard===m.kind?'page':undefined} onClick={()=>selectSection('dashboard',m.kind)}><Icon name={m.kind}/><span>{t(['Revenue','Customers','Operations'][i],['매출','고객','운영'][i])}</span><small>0{i+1}</small></button>)}</nav>
        <nav aria-label={t('Components','컴포넌트')}><div className="demo-nav-label">{t('Components','컴포넌트')}<span>38</span></div>{(['metrics','charts','table','navigation','controls','states','pages'] as const).map(s=><button className="demo-nav-item" type="button" key={s} aria-current={section===s?'page':undefined} onClick={()=>selectSection(s)}><Icon name={s}/><span>{sectionNames[s]}</span></button>)}</nav>
        <div className="demo-library-bottom"><div className="demo-local-mark"><i/>{t('Local by design','로컬에서 동작')}</div><p>{t('React + TypeScript. No account, API key or backend required.','React + TypeScript. 계정, API 키, 백엔드 없이 사용합니다.')}</p><Button onClick={()=>fileRef.current?.click()}>{t('Import KPI JSON','KPI JSON 가져오기')} <span aria-hidden="true">↑</span></Button><input ref={fileRef} className="kk-sr-only" type="file" accept="application/json,.json" onChange={e=>{const f=e.target.files?.[0];if(f)void importFile(f)}}/></div>
      </aside>
      <main className="demo-preview" aria-label={t('Preview','미리보기')}>
        <div className="demo-canvas-toolbar"><div><span>{section==='dashboard'?t('Templates','템플릿'):t('Components','컴포넌트')}</span><span className="demo-slash">/</span><strong>{sectionNames[section]}</strong></div><div className="demo-toolbar-actions"><Button variant="quiet" onClick={inspectCode}><Icon name="code"/>{t('View code','코드 보기')}</Button><Button aria-expanded={inspectorOpen} onClick={()=>{setInspectorOpen(!inspectorOpen);setMobile('inspect');}}>{t('Inspector','설정·코드')} <span aria-hidden="true">☷</span></Button></div></div>
        <div className="demo-canvas" key={section}>
          {importError&&<div className="demo-error" role="alert">{importError}<Button variant="quiet" onClick={()=>setImportError('')}>{t('Dismiss','닫기')}</Button></div>}
          {section==='dashboard'?<DashboardPreview model={model} meta={activeMeta} locale={locale} onRangeChange={setRange} onInspect={tab=>{setInspector(tab);setInspectorOpen(true);setMobile('inspect');}}/>:<>
            <section className="demo-dashboard-head"><div><div className="demo-eyebrow">{t('COMPONENT STUDIO','컴포넌트 스튜디오')}</div><h1>{sectionNames[section]}</h1><p>{t('Reusable parts, explicit contracts. Inspect the data and take the code.','재사용 가능한 부품과 명시적인 계약. 원값을 확인하고 코드를 가져가세요.')}</p></div><span className="demo-sample">{section==='metrics'&&imported?t('Imported metrics','가져온 KPI'):t('Isolated sample','독립 샘플')}</span></section>
            <p className="demo-sample-scope">{isStudioSection(section)?t('Interactive local examples. Recovery and confirmation actions change this sample only.','직접 조작하는 로컬 예제입니다. 복구와 확인 동작은 이 샘플만 변경합니다.'):t('Component samples use a fixed scope; dashboard date filters do not apply.','컴포넌트 샘플은 고정된 범위를 사용하며 대시보드 기간 필터와 분리됩니다.')}</p>
            {section==='metrics'&&<><div className="demo-specimen-label"><span>{patternNames[pattern]}</span><span>MetricCard</span></div><div className="demo-metric-specimen">{selectedMetric?<MetricCard metric={selectedMetric} pattern={pattern} trend={pattern==='sparkline'?metricTrend:undefined} locale={locale}/>:<StatePanel title={t('No metrics','KPI 없음')} message={t('Import at least one valid metric.','유효한 KPI를 하나 이상 가져오세요.')}/>}</div><div className="demo-pattern-gallery">{patterns.map(p=><button key={p} onClick={()=>setPattern(p)} aria-pressed={pattern===p}><span className={`demo-mini-metric demo-mini-${p}`} aria-hidden="true"><b>1,284</b><i/><i/><i/></span><strong>{patternNames[p]}</strong></button>)}</div><div className="demo-contract-note"><strong>{t('Meaning before presentation','표현보다 먼저, 숫자의 의미')}</strong><p>{t('Units, time scope, quality, comparison basis and polarity travel with every metric. Missing values stay missing.','단위·기간·품질·비교 기준·개선 방향을 모든 KPI에 명시합니다. 관측되지 않은 값은 0으로 바꾸지 않습니다.')}</p></div></>}
            {section==='charts'&&<><div className="demo-specimen-label"><span>{names[chart]}</span><span>{t('Live component','실제 컴포넌트')}</span></div><div className="demo-chart-specimen"><ChartPreview kind={chart} locale={locale}/></div><div className="demo-chart-selector">{chartKinds.map(k=><button key={k} aria-pressed={chart===k} onClick={()=>setChart(k)}>{names[k]}</button>)}</div><div className="demo-contract-note"><strong>{t('Read the whole story','숫자의 맥락까지 읽기')}</strong><p>{t('Zero baselines, signed values, explicit units and accessible source tables. Grouped bars include negative values; the waterfall includes a zero movement.','0 기준선, 부호가 있는 값, 명시적 단위와 원값 표. 그룹 막대에는 음수, 워터폴에는 0 증감 예제가 포함됩니다.')}</p></div></>}
            {section==='table'&&<DataTable title={componentModel.tableTitle} rows={componentModel.rows} columns={componentModel.columns} getRowId={r=>r.id} selectable locale={locale}/>}
            {isStudioSection(section)&&activeExample&&<div className="demo-studio-workspace">
              <div className="demo-studio-selector"><label><span id={exampleLabelId}>{t('Choose example','예제 선택')}</span><select aria-labelledby={exampleLabelId} value={activeExample.id} onChange={e=>setStudioSelection({...studioSelection,[section]:e.target.value})}>{activeExamples.map(example=><option value={example.id} key={example.id}>{example.label}</option>)}</select></label><div><strong>{activeExample.label}</strong><p>{activeExample.description}</p></div><span className="demo-studio-count">{String(activeExamples.findIndex(e=>e.id===activeExample.id)+1).padStart(2,'0')} / {String(activeExamples.length).padStart(2,'0')}</span></div>
              <div className={`demo-studio-stage demo-studio-stage--${section}`}><StudioPreview section={section} kind={activeExample.id} locale={locale}/></div>
              <div className="demo-studio-footer"><span>{t('Reusable component + working example','재사용 컴포넌트 + 동작하는 예제')}</span><Button onClick={inspectCode}>{t('Get this example','이 예제 코드 보기')} <Icon name="code"/></Button></div>
            </div>}
          </>}
        </div>
      </main>
      <aside className="demo-inspector" aria-label={t('Inspector','설정·코드')}>
        <div className="demo-inspector-tabs"><Tabs value={inspector} onChange={v=>{setInspector(v);setCopyStatus('');}} label={t('Inspector views','검사 항목')} items={[{value:'options',label:t('Options','옵션')},{value:'data',label:t('Data','데이터')},{value:'code',label:t('Code','코드')}]}/><button className="demo-inspector-close" aria-label={t('Close inspector','설정 패널 닫기')} onClick={()=>{setInspectorOpen(false);setMobile('preview');}}>×</button></div>
        <div className="demo-inspector-body">
          {inspector==='options'&&<>
            <div className="demo-inspector-heading"><span>{t('CONFIGURATION','설정')}</span><h2>{sectionNames[section]}</h2><p>{section==='dashboard'?t('Every view follows the same date range.','모든 표시가 같은 기간을 따릅니다.'):t('Change the component, keep the contract.','계약을 유지하며 표현을 바꿉니다.')}</p></div>
            {section==='dashboard'?<><div className="demo-option-group"><h3>{t('Date range','조회 기간')}</h3><div className="demo-preset-row"><button aria-pressed={range.start===INITIAL_RANGE.start&&range.end===INITIAL_RANGE.end} onClick={()=>setRange(INITIAL_RANGE)}>{t('Sample week','샘플 주간')}</button><button aria-pressed={range.start==='2026-09-01'&&range.end==='2026-09-14'} onClick={()=>setRange({start:'2026-09-01',end:'2026-09-14'})}>{t('14 days','14일')}</button></div><DateRangeField {...range} onChange={setRange} startLabel={t('Start date','시작일')} endLabel={t('End date','종료일')}/><small>{t('Available sample','샘플 제공 범위')}<br/>{AVAILABLE_RANGE.start} — {AVAILABLE_RANGE.end}</small></div><div className="demo-option-group"><h3>{t('Comparison','비교 기준')}</h3><p>{model.previousRange?`${model.previousRange.start} → ${model.previousRange.end}`:'—'}</p><small>{t('Previous period of the same length. Incomplete comparisons are withheld.','같은 길이의 이전 기간입니다. 관측이 불완전하면 비교를 보류합니다.')}</small></div><div className="demo-option-group"><h3>{t('Calculation notes','계산 방식')}</h3><ul>{model.methodology.map((note,i)=><li key={i}>{note}</li>)}</ul></div></>:isStudioSection(section)?<div className="demo-option-group"><h3>{t('Available examples','예제 목록')}</h3><div className="demo-choice-list">{activeExamples.map(example=><button key={example.id} aria-pressed={activeExample?.id===example.id} onClick={()=>setStudioSelection({...studioSelection,[section]:example.id})}>{example.label}<span>↗</span></button>)}</div><small>{t('Select one scenario. Reset and recovery stay inside the demo.','한 시나리오씩 선택합니다. 초기화·복구는 예제 안에서만 적용됩니다.')}</small></div>:section==='metrics'?<><div className="demo-option-group"><h3>{t('Presentation','표현 방식')}</h3><div className="demo-choice-list">{patterns.map(p=><button key={p} aria-pressed={pattern===p} onClick={()=>setPattern(p)}>{patternNames[p]}<span>{p}</span></button>)}</div></div>{imported&&<div className="demo-option-group"><h3>{t('Imported dataset','가져온 데이터')}</h3><p>{imported.name}</p><label className="kk-field demo-metric-select"><span id={metricLabelId}>{t('Metric','KPI 선택')}</span><select aria-labelledby={metricLabelId} value={baseMetric?.definition.id??''} onChange={e=>setMetricId(e.target.value)}>{metrics.map(m=><option key={m.definition.id} value={m.definition.id}>{m.definition.title}</option>)}</select></label><Button onClick={()=>setImported(null)}>{t('Use sample metrics','샘플 KPI 사용')}</Button></div>}</>:section==='charts'?<div className="demo-option-group"><h3>{t('Chart type','차트 유형')}</h3><div className="demo-choice-list">{chartKinds.map(k=><button key={k} aria-pressed={chart===k} onClick={()=>setChart(k)}>{names[k]}<span>{String(chartKinds.indexOf(k)+1).padStart(2,'0')}</span></button>)}</div></div>:<div className="demo-option-group"><h3>{t('Try the interaction','직접 조작하기')}</h3><p>{section==='table'?t('Search, sort a column, select rows, then export the filtered or selected result.','검색·열 정렬·행 선택 후 필터 결과나 선택한 행을 내보내세요.'):t('Controls retain local state. No email or alert subscription is created.','컨트롤은 로컬 상태만 변경합니다. 실제 이메일이나 알림을 구독하지 않습니다.')}</p></div>}
            <div className="demo-inspector-tip"><Icon name="code"/><strong>{t('Make it yours','직접 조합하세요')}</strong><p>{t('Copy a complete TSX example from Code. Keep src/kit independent from your data adapter.','코드 탭에서 완전한 TSX 예제를 복사하세요. src/kit과 데이터 어댑터는 분리해서 사용합니다.')}</p><button onClick={inspectCode}>{t('Inspect example','예제 코드 보기')} →</button></div>
          </>}
          {inspector==='data'&&<><div className="demo-inspector-heading"><span>{t('SOURCE DATA','원천 데이터')}</span><h2>{isStudioSection(section)?t('Example contract','예제 동작 계약'):t('Explicit by default','숫자의 의미를 명시')}</h2><p>{isStudioSection(section)?t('Scenario metadata. Inputs and recovery use component-local state.','시나리오 메타데이터입니다. 입력과 복구는 컴포넌트 로컬 상태를 사용합니다.'):t('Synthetic observations and computed values for the current preview.','현재 미리보기에 사용하는 합성 관측값과 계산 결과입니다.')}</p></div><pre className="demo-data-code" tabIndex={0}><code>{JSON.stringify(rawData,null,2)}</code></pre></>}
          {inspector==='code'&&<><div className="demo-inspector-heading"><span>REACT + TYPESCRIPT</span><h2>{section==='dashboard'?t('Core integration example','핵심 통합 예제'):t('Use this pattern','이 패턴 사용하기')}</h2><p>{section==='dashboard'?t('Runnable metrics, charts and table. The full styled composition is in DashboardPreview.tsx.','실행 가능한 KPI·차트·표 예제입니다. 전체 화면 구성은 DashboardPreview.tsx에 있습니다.'):t('A complete TSX module. Place beside a copy of src/kit.','완전한 TSX 모듈입니다. 복사한 src/kit 옆에 배치하세요.')}</p></div><Button variant="primary" onClick={()=>void copyCode()}>{t('Copy code','코드 복사')}</Button>{copyStatus&&<p role="status" className="demo-copy-status">{copyStatus}</p>}<pre className="demo-data-code" tabIndex={0}><code>{code}</code></pre></>}
        </div>
      </aside>
    </div>
    <footer className="demo-footer"><span><i/>{t('Synthetic examples · no live connection','합성 예제 · 실시간 연결 없음')}</span><span>React + TypeScript <b>·</b> MIT <b>·</b> CHIRPYWORKS</span></footer>
  </div>;
}
