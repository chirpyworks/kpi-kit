import React, { useId, useRef, useState } from 'react';
import type { KitLocale } from '../kit/contracts.js';
import { Breadcrumbs, DashboardShell, DetailPanel, getPaginationState, PageHeader, Pagination, SideNavigation } from '../kit/ui/navigation.js';
import { Button, Tabs } from '../kit/ui/primitives.js';
import { navigationContent, type NavigationKind } from './navigation-examples.js';
export type { NavigationKind } from './navigation-examples.js';

type ExampleProps = { locale: KitLocale };

function ShellExample({ locale }: ExampleProps) {
  const copy = navigationContent(locale).shell;
  const [value, setValue] = useState('overview');
  const view = copy.views.find(item => item.id === value) ?? copy.views[0];
  return <div className="kk-navigation-example"><DashboardShell label={copy.label}
    navigation={<SideNavigation label={copy.navigation} items={copy.views} value={value} onValueChange={setValue}/>}
    header={<PageHeader headingLevel={2} eyebrow={copy.eyebrow} title={view.label} description={view.description}
      breadcrumbs={<Breadcrumbs locale={locale} items={[{ id: 'workspace', label: copy.workspace, onClick: () => setValue('overview') }, { id: view.id, label: view.label }]}/>}
      actions={value !== 'activity' ? <Button onClick={() => setValue('activity')}>{copy.activityAction}</Button> : undefined}/>}
    footer={copy.footer}>
    <div aria-live="polite"><div className="kk-navigation-stats">{view.stats.map(stat => <div className="kk-navigation-stat" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}</div>
      <h3 className="kk-navigation-section-label">{copy.recordsLabel}</h3><ul className="kk-navigation-list">{view.records.map((record, index) => <li key={record}><span>{record}</span><span>{String(index + 1).padStart(2, '0')}</span></li>)}</ul>
    </div>
  </DashboardShell></div>;
}

function BreadcrumbsExample({ locale }: ExampleProps) {
  const copy = navigationContent(locale).breadcrumbs;
  const [depth, setDepth] = useState(2);
  const current = copy.levels[depth];
  return <div className="kk-navigation-example"><div className="kk-navigation-card">
    <PageHeader headingLevel={2} eyebrow={copy.eyebrow} title={current.label} description={current.description}
      breadcrumbs={<Breadcrumbs locale={locale} items={copy.levels.slice(0, depth + 1).map((level, index) => ({ id: level.id, label: level.label, onClick: () => setDepth(index) }))}/>}/>
    <div aria-live="polite">{depth === 2 ? <div className="kk-navigation-stat"><span>{copy.metricLabel}</span><strong>{copy.metricValue}</strong><span>{copy.scope}</span></div> : <ul className="kk-navigation-list"><li><span>{copy.levels[depth + 1].label}</span><Button onClick={() => setDepth(depth + 1)}>{copy.open}</Button></li></ul>}</div>
    {depth === 2 && <div><Button onClick={() => setDepth(0)}>{copy.restart}</Button></div>}
    <p className="kk-navigation-note">{copy.note}</p>
  </div></div>;
}

function TabsExample({ locale }: ExampleProps) {
  const copy = navigationContent(locale).tabs;
  const [value, setValue] = useState('summary');
  const item = copy.items.find(entry => entry.id === value) ?? copy.items[0];
  return <div className="kk-navigation-example"><div className="kk-navigation-card">
    <PageHeader headingLevel={2} title={copy.title}/>
    <Tabs label={copy.label} value={value} onChange={setValue} items={copy.items.map(entry => ({ value: entry.id, label: entry.label }))}/>
    <section role="tabpanel" tabIndex={0} aria-label={item.label} className="kk-navigation-tabpanel"><h3>{item.title}</h3><p>{item.description}</p><ul className="kk-navigation-list">{item.rows.map(row => <li key={row}>{row}</li>)}</ul></section>
    <p className="kk-navigation-note">{copy.note}</p>
  </div></div>;
}

function DetailExample({ locale }: ExampleProps) {
  const copy = navigationContent(locale).detail;
  const [selected, setSelected] = useState<string | null>('channel');
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelId = useId();
  const report = copy.reports.find(item => item.id === selected);
  function close() {
    if (selected) triggers.current[selected]?.focus();
    setSelected(null);
  }
  return <div className="kk-navigation-example"><div className="kk-navigation-card">
    <PageHeader headingLevel={2} title={copy.title} description={copy.description}/>
    <div className="kk-navigation-detail-layout" data-open={!!report}>
      <div className="kk-navigation-report-list">{copy.reports.map(item => <button key={item.id} type="button" ref={node => { triggers.current[item.id] = node; }} aria-expanded={selected === item.id} aria-controls={report ? panelId : undefined} onClick={() => setSelected(item.id)}><span><strong>{item.title}</strong><small>{item.scope}</small></span><span aria-hidden="true">↗</span></button>)}
        {!report && <p className="kk-navigation-note" role="status">{copy.closed}</p>}
      </div>
      <DetailPanel id={panelId} open={!!report} onClose={close} title={report?.title ?? ''} description={copy.panelDescription} closeLabel={copy.close} locale={locale} footer={copy.footer}>
        {report && <dl className="kk-navigation-definition"><div><dt>{copy.scopeLabel}</dt><dd>{report.scope}</dd></div><div><dt>{copy.ownerLabel}</dt><dd>{report.team}</dd></div><div><dt>{copy.statusLabel}</dt><dd>{report.status}</dd></div><div><dt>{report.title}</dt><dd>{report.note}</dd></div></dl>}
      </DetailPanel>
    </div>
  </div></div>;
}

function PaginationExample({ locale }: ExampleProps) {
  const copy = navigationContent(locale).pagination;
  const [page, setPage] = useState(1);
  const state = getPaginationState({ page, pageSize: 5, totalItems: copy.rows.length });
  const rows = copy.rows.slice(state.startIndex, state.endIndex);
  return <div className="kk-navigation-example"><div className="kk-navigation-card">
    <PageHeader headingLevel={2} title={copy.title} description={copy.description}/>
    <ul className="kk-navigation-list kk-navigation-pages-list" aria-live="polite">{rows.map((row, index) => <li key={row.id}><span className="kk-navigation-result-name"><span className="kk-navigation-item-index">{String(state.startIndex + index + 1).padStart(2, '0')}</span>{row.title}</span><span>{row.scope}</span></li>)}</ul>
    <Pagination page={state.page} pageSize={5} totalItems={copy.rows.length} onPageChange={setPage} locale={locale} label={copy.label}/>
  </div></div>;
}

/** Only the selected specimen is mounted, so each example remains small and independent. */
export function NavigationStudio({ kind, locale }: { kind: NavigationKind; locale: KitLocale }) {
  if (kind === 'shell') return <ShellExample locale={locale}/>;
  if (kind === 'breadcrumbs') return <BreadcrumbsExample locale={locale}/>;
  if (kind === 'tabs') return <TabsExample locale={locale}/>;
  if (kind === 'detail') return <DetailExample locale={locale}/>;
  return <PaginationExample locale={locale}/>;
}
