import type { KitLocale } from '../kit/contracts.js';

export type NavigationKind = 'shell' | 'breadcrumbs' | 'tabs' | 'detail' | 'pagination';
export const navigationKinds: NavigationKind[] = ['shell', 'breadcrumbs', 'tabs', 'detail', 'pagination'];
export function navigationExamples(locale: KitLocale): { id: NavigationKind; label: string; description: string }[] {
  const ko = locale === 'ko';
  return [
    { id: 'shell', label: ko ? '대시보드 셸' : 'Dashboard shell', description: ko ? '메뉴 선택에 따라 실제 콘텐츠가 바뀌는 반응형 레이아웃입니다.' : 'A responsive layout with navigation that switches the visible view.' },
    { id: 'breadcrumbs', label: ko ? '경로와 페이지 헤더' : 'Breadcrumbs & page header', description: ko ? '상위 경로로 돌아가거나 보고서로 내려가세요.' : 'Move back through a hierarchy or open the next report level.' },
    { id: 'tabs', label: ko ? '콘텐츠 탭' : 'Content tabs', description: ko ? '요약, 원천 정보, 활동 내역을 독립 패널로 전환합니다.' : 'Switch between summary, source information, and activity panels.' },
    { id: 'detail', label: ko ? '상세 패널' : 'Detail panel', description: ko ? '목록을 유지한 채 상세 정보를 열고 닫습니다.' : 'Open supporting detail alongside the list, then close it.' },
    { id: 'pagination', label: ko ? '페이지 이동' : 'Pagination', description: ko ? '페이지 번호를 선택하면 현재 결과 목록이 함께 바뀝니다.' : 'Choose a page to display its matching result slice.' },
  ];
}

/** Synthetic, localized content shared by the live specimens and their standalone snippets. */
export function navigationContent(locale: KitLocale) {
  const ko = locale === 'ko';
  return {
    shell: {
      label: ko ? '워크스페이스 미리보기' : 'Workspace preview',
      workspace: ko ? '워크스페이스' : 'Workspace', navigation: ko ? '워크스페이스 메뉴' : 'Workspace navigation',
      eyebrow: ko ? '샘플 워크스페이스' : 'SAMPLE WORKSPACE', activityAction: ko ? '활동 보기' : 'View activity',
      recordsLabel: ko ? '최근 항목' : 'Recent items', footer: ko ? '합성 예제 · 메뉴와 경로는 이 예제 안에서만 이동합니다.' : 'Synthetic example · navigation stays inside this specimen.',
      views: [
        { id: 'overview', label: ko ? '개요' : 'Overview', description: ko ? '선택된 워크스페이스의 보고서 현황입니다.' : 'Report status for the selected workspace.', stats: [{ label: ko ? '공유된 보고서' : 'Shared reports', value: '12' }, { label: ko ? '검토 대기' : 'Awaiting review', value: '3' }], records: ko ? ['채널 분석 보고서', '고객 유지 보고서', '운영 주간 보고서'] : ['Channel performance', 'Customer retention', 'Weekly operations'] },
        { id: 'reports', label: ko ? '보고서' : 'Reports', description: ko ? '최신 보고서와 검토할 초안을 살펴보세요.' : 'Browse the latest reports and drafts awaiting review.', stats: [{ label: ko ? '게시된 보고서' : 'Published reports', value: '9' }, { label: ko ? '작성 중' : 'In progress', value: '3' }], records: ko ? ['9월 매출 보고서', '가입 전환 분석', '응답 시간 요약'] : ['September revenue', 'Signup conversion', 'Response time summary'] },
        { id: 'activity', label: ko ? '활동' : 'Activity', description: ko ? '이 워크스페이스의 최근 로컬 샘플 활동입니다.' : 'Recent synthetic activity in this workspace.', stats: [{ label: ko ? '검토 완료' : 'Reviews completed', value: '7' }, { label: ko ? '이번 주 업데이트' : 'Updates this week', value: '18' }], records: ko ? ['채널 보고서 검토 완료', '운영 보고서 업데이트', '주간 요약 작성'] : ['Channel report reviewed', 'Operations report updated', 'Weekly summary created'] },
      ],
    },
    breadcrumbs: {
      eyebrow: ko ? '보고서 탐색' : 'REPORT NAVIGATION', open: ko ? '열기' : 'Open', restart: ko ? '워크스페이스로 돌아가기' : 'Back to workspace',
      note: ko ? '경로를 누르면 해당 상위 화면으로 돌아갑니다.' : 'Each earlier breadcrumb returns to that level.',
      levels: [
        { id: 'workspace', label: ko ? '워크스페이스' : 'Workspace', description: ko ? '보고서 폴더를 열어 팀의 지표를 살펴보세요.' : 'Open the reports folder to explore your team’s metrics.' },
        { id: 'reports', label: ko ? '보고서' : 'Reports', description: ko ? '매출 보고서를 선택해 해당 요약을 확인하세요.' : 'Choose the revenue report to inspect its summary.' },
        { id: 'revenue', label: ko ? '매출 요약' : 'Revenue summary', description: ko ? '2026년 9월 · 합성 주간 데이터 · USD' : 'September 2026 · synthetic weekly observations · USD' },
      ],
      metricLabel: ko ? '관측 매출' : 'Observed revenue', metricValue: '$12,480', scope: ko ? '9월 1–7일 · 샘플 매출' : 'Sep 1–7 · sample revenue',
    },
    tabs: {
      title: ko ? '보고서 검토' : 'Report review', label: ko ? '보고서 정보' : 'Report information', note: ko ? '← → 키로 탭을 바꾸고 Home / End 키로 이동하세요.' : 'Use ← → to switch tabs and Home / End to jump.',
      items: [
        { id: 'summary', label: ko ? '요약' : 'Summary', title: ko ? '채널 실적 요약' : 'Channel performance summary', description: ko ? '고정된 샘플 기간의 관측값을 보여줍니다. 원천 정보 탭에서 범위를 확인하세요.' : 'Observed values for a fixed sample period. Inspect Source for the scope.', rows: ko ? ['신규 고객 128명', '검토 대상 채널 4개', '범위: 9월 1–7일'] : ['128 new customers', '4 channels under review', 'Scope: Sep 1–7'] },
        { id: 'source', label: ko ? '원천 정보' : 'Source', title: ko ? '관측 범위와 출처' : 'Scope and source', description: ko ? '합성 데이터가 로컬에 제공됩니다. 실제 고객 데이터나 외부 API를 사용하지 않습니다.' : 'Synthetic data is supplied locally, with no customer records or external API.', rows: ko ? ['단위: 고객 수', '집계: 채널별 샘플 건수', '실시간 연결 없음'] : ['Unit: customer count', 'Aggregation: sample count by channel', 'No live connection'] },
        { id: 'activity', label: ko ? '활동' : 'Activity', title: ko ? '검토 내역' : 'Review activity', description: ko ? '예제에 포함된 고정된 검토 내역입니다.' : 'A fixed review log included with this example.', rows: ko ? ['09:40 · 관측 범위 확인', '10:10 · 채널 이름 정리', '10:30 · 요약 검토 완료'] : ['09:40 · Scope checked', '10:10 · Channel labels updated', '10:30 · Summary review completed'] },
      ],
    },
    detail: {
      title: ko ? '보고서 목록' : 'Report list', description: ko ? '보고서를 선택하면 옆에서 상세 정보를 확인할 수 있습니다.' : 'Select a report to inspect its details alongside the list.',
      panelDescription: ko ? '선택한 보고서 · 합성 예제' : 'Selected report · synthetic example', close: ko ? '상세 패널 닫기' : 'Close detail panel',
      scopeLabel: ko ? '관측 범위' : 'Scope', ownerLabel: ko ? '담당 팀' : 'Owner team', statusLabel: ko ? '검토 상태' : 'Review status',
      closed: ko ? '상세 패널을 닫았습니다. 보고서를 선택해 다시 열 수 있습니다.' : 'Detail panel closed. Select a report to reopen it.',
      footer: ko ? '비모달 패널 · 배경 목록도 계속 사용할 수 있습니다.' : 'Non-modal panel · the report list stays available.',
      reports: [
        { id: 'channel', title: ko ? '채널 실적' : 'Channel performance', scope: ko ? '9월 1–7일 · 고객 수' : 'Sep 1–7 · customer count', team: ko ? '그로스 팀' : 'Growth team', status: ko ? '검토 완료' : 'Reviewed', note: ko ? '채널별 신규 고객 수를 같은 기간으로 비교합니다.' : 'Compares new customer counts by channel for the same period.' },
        { id: 'retention', title: ko ? '고객 유지' : 'Customer retention', scope: ko ? '9월 코호트 · 유지율' : 'September cohort · retention rate', team: ko ? '고객 경험 팀' : 'Customer experience team', status: ko ? '검토 대기' : 'Awaiting review', note: ko ? '동일한 가입 코호트를 기준으로 고객 유지율을 확인합니다.' : 'Reviews retention using the same signup cohort as the denominator.' },
      ],
    },
    pagination: {
      title: ko ? '보고서 보관함' : 'Report archive', description: ko ? '페이지당 5개 항목 · 로컬 합성 예제' : '5 items per page · local synthetic example',
      label: ko ? '보관함 페이지 이동' : 'Archive pagination',
      rows: Array.from({ length: 23 }, (_, index) => ({ id: `report-${index + 1}`, title: ko ? `주간 보고서 ${String(index + 1).padStart(2, '0')}` : `Weekly report ${String(index + 1).padStart(2, '0')}`, scope: ko ? `${index + 1}주차` : `Week ${index + 1}` })),
    },
  };
}

const exampleBodies: Record<NavigationKind, string> = {
  "shell": "  const [value, setValue] = useState('overview');\n  const view = copy.views.find(item => item.id === value) ?? copy.views[0];\n  return <div className=\"kk-navigation-example\"><DashboardShell label={copy.label}\n    navigation={<SideNavigation label={copy.navigation} items={copy.views} value={value} onValueChange={setValue}/>}\n    header={<PageHeader headingLevel={2} eyebrow={copy.eyebrow} title={view.label} description={view.description}\n      breadcrumbs={<Breadcrumbs locale={locale} items={[{ id: 'workspace', label: copy.workspace, onClick: () => setValue('overview') }, { id: view.id, label: view.label }]}/>}\n      actions={value !== 'activity' ? <Button onClick={() => setValue('activity')}>{copy.activityAction}</Button> : undefined}/>}\n    footer={copy.footer}>\n    <div aria-live=\"polite\"><div className=\"kk-navigation-stats\">{view.stats.map(stat => <div className=\"kk-navigation-stat\" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}</div>\n      <h3 className=\"kk-navigation-section-label\">{copy.recordsLabel}</h3><ul className=\"kk-navigation-list\">{view.records.map((record, index) => <li key={record}><span>{record}</span><span>{String(index + 1).padStart(2, '0')}</span></li>)}</ul>\n    </div>\n  </DashboardShell></div>;",
  "breadcrumbs": "  const [depth, setDepth] = useState(2);\n  const current = copy.levels[depth];\n  return <div className=\"kk-navigation-example\"><div className=\"kk-navigation-card\">\n    <PageHeader headingLevel={2} eyebrow={copy.eyebrow} title={current.label} description={current.description}\n      breadcrumbs={<Breadcrumbs locale={locale} items={copy.levels.slice(0, depth + 1).map((level, index) => ({ id: level.id, label: level.label, onClick: () => setDepth(index) }))}/>}/>\n    <div aria-live=\"polite\">{depth === 2 ? <div className=\"kk-navigation-stat\"><span>{copy.metricLabel}</span><strong>{copy.metricValue}</strong><span>{copy.scope}</span></div> : <ul className=\"kk-navigation-list\"><li><span>{copy.levels[depth + 1].label}</span><Button onClick={() => setDepth(depth + 1)}>{copy.open}</Button></li></ul>}</div>\n    {depth === 2 && <div><Button onClick={() => setDepth(0)}>{copy.restart}</Button></div>}\n    <p className=\"kk-navigation-note\">{copy.note}</p>\n  </div></div>;",
  "tabs": "  const [value, setValue] = useState('summary');\n  const item = copy.items.find(entry => entry.id === value) ?? copy.items[0];\n  return <div className=\"kk-navigation-example\"><div className=\"kk-navigation-card\">\n    <PageHeader headingLevel={2} title={copy.title}/>\n    <Tabs label={copy.label} value={value} onChange={setValue} items={copy.items.map(entry => ({ value: entry.id, label: entry.label }))}/>\n    <section role=\"tabpanel\" tabIndex={0} aria-label={item.label} className=\"kk-navigation-tabpanel\"><h3>{item.title}</h3><p>{item.description}</p><ul className=\"kk-navigation-list\">{item.rows.map(row => <li key={row}>{row}</li>)}</ul></section>\n    <p className=\"kk-navigation-note\">{copy.note}</p>\n  </div></div>;",
  "detail": "  const [selected, setSelected] = useState<string | null>('channel');\n  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});\n  const panelId = useId();\n  const report = copy.reports.find(item => item.id === selected);\n  function close() {\n    if (selected) triggers.current[selected]?.focus();\n    setSelected(null);\n  }\n  return <div className=\"kk-navigation-example\"><div className=\"kk-navigation-card\">\n    <PageHeader headingLevel={2} title={copy.title} description={copy.description}/>\n    <div className=\"kk-navigation-detail-layout\" data-open={!!report}>\n      <div className=\"kk-navigation-report-list\">{copy.reports.map(item => <button key={item.id} type=\"button\" ref={node => { triggers.current[item.id] = node; }} aria-expanded={selected === item.id} aria-controls={report ? panelId : undefined} onClick={() => setSelected(item.id)}><span><strong>{item.title}</strong><small>{item.scope}</small></span><span aria-hidden=\"true\">↗</span></button>)}\n        {!report && <p className=\"kk-navigation-note\" role=\"status\">{copy.closed}</p>}\n      </div>\n      <DetailPanel id={panelId} open={!!report} onClose={close} title={report?.title ?? ''} description={copy.panelDescription} closeLabel={copy.close} locale={locale} footer={copy.footer}>\n        {report && <dl className=\"kk-navigation-definition\"><div><dt>{copy.scopeLabel}</dt><dd>{report.scope}</dd></div><div><dt>{copy.ownerLabel}</dt><dd>{report.team}</dd></div><div><dt>{copy.statusLabel}</dt><dd>{report.status}</dd></div><div><dt>{report.title}</dt><dd>{report.note}</dd></div></dl>}\n      </DetailPanel>\n    </div>\n  </div></div>;",
  "pagination": "  const [page, setPage] = useState(1);\n  const state = getPaginationState({ page, pageSize: 5, totalItems: copy.rows.length });\n  const rows = copy.rows.slice(state.startIndex, state.endIndex);\n  return <div className=\"kk-navigation-example\"><div className=\"kk-navigation-card\">\n    <PageHeader headingLevel={2} title={copy.title} description={copy.description}/>\n    <ul className=\"kk-navigation-list kk-navigation-pages-list\" aria-live=\"polite\">{rows.map((row, index) => <li key={row.id}><span className=\"kk-navigation-result-name\"><span className=\"kk-navigation-item-index\">{String(state.startIndex + index + 1).padStart(2, '0')}</span>{row.title}</span><span>{row.scope}</span></li>)}</ul>\n    <Pagination page={state.page} pageSize={5} totalItems={copy.rows.length} onPageChange={setPage} locale={locale} label={copy.label}/>\n  </div></div>;"
};
const exampleImports: Record<NavigationKind, string> = {
  "shell": "Breadcrumbs, Button, DashboardShell, PageHeader, SideNavigation",
  "breadcrumbs": "Breadcrumbs, Button, PageHeader",
  "tabs": "PageHeader, Tabs",
  "detail": "DetailPanel, PageHeader",
  "pagination": "getPaginationState, PageHeader, Pagination"
};

/** Complete TSX modules. Place beside a copied src/kit directory. */
export function navigationSnippet(kind: NavigationKind, locale: KitLocale): string {
  const copy = navigationContent(locale)[kind];
  const hooks = kind === 'detail' ? 'useId, useRef, useState' : 'useState';
  return `import React, { ${hooks} } from 'react';\nimport { ${exampleImports[kind]} } from './kit/index.js';\nimport './kit/styles.css';\n\nconst locale = '${locale}';\nconst copy = ${JSON.stringify(copy, null, 2)};\n\nexport default function Example() {\n${exampleBodies[kind].replace('className="kk-navigation-example"', 'className="kk-root kk-navigation-example"')}\n}\n`;
}
