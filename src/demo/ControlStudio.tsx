import React, { useReducer, useRef, useState } from 'react';
import type { KitLocale } from '../kit/contracts.js';
import { Badge, Button, Checkbox, Dialog, FilterChip, Switch, Tooltip } from '../kit/ui/primitives.js';
import { ConfirmDialog, InputField, Notification, SelectField } from '../kit/ui/controls.js';
import {
  controlCopy, defaultReportFilters, filterReports, initialConfirmationState, initialFormState,
  sampleReports, transitionConfirmation, transitionNotification, transitionReportForm, validateReportForm,
} from './control-examples.js';
import type { ControlKind, ReportFilters, ReportFormAction, ReportFormValues } from './control-examples.js';

function Panel({ title, description, locale, children, footer }: { title: string; description: string; locale: KitLocale; children: React.ReactNode; footer?: React.ReactNode }) {
  return <section className="kk-control-panel">
    <header className="kk-control-panel-header"><div><h3>{title}</h3><p>{description}</p></div><Badge>{controlCopy(locale).sample}</Badge></header>
    <div className="kk-control-panel-body">{children}</div>
    {footer && <footer className="kk-control-panel-footer">{footer}</footer>}
  </section>;
}

function FormExample({ locale }: { locale: KitLocale }) {
  const c = controlCopy(locale);
  const [state, dispatch] = useReducer((previous: ReturnType<typeof initialFormState>, action: ReportFormAction) => transitionReportForm(previous, action, locale), undefined, initialFormState);
  const nameRef = useRef<HTMLInputElement>(null), targetRef = useRef<HTMLInputElement>(null), cadenceRef = useRef<HTMLSelectElement>(null);
  const errors = state.submitted ? validateReportForm(state.values, locale) : {};
  const change = (values: Partial<ReportFormValues>) => dispatch({ type: 'change', values });
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = transitionReportForm(state, { type: 'submit' }, locale);
    dispatch({ type: 'submit' });
    if (next.errors.name) nameRef.current?.focus();
    else if (next.errors.target) targetRef.current?.focus();
    else if (next.errors.cadence) cadenceRef.current?.focus();
  }
  return <form noValidate onSubmit={submit}>
    <Panel title={c.title} description={c.subtitle} locale={locale} footer={<><p>{c.localNote}</p><div className="kk-control-actions"><Button onClick={() => dispatch({ type: 'fill' })}>{c.fill}</Button><Button type="submit" variant="primary">{c.save}</Button></div></>}>
      <div className="kk-control-form-grid">
        <InputField ref={nameRef} name="report-name" label={c.name} value={state.values.name} placeholder={c.namePlaceholder} required maxLength={64} autoComplete="off" hint={c.nameHint} error={errors.name} onChange={event => change({ name: event.target.value })}/>
        <InputField ref={targetRef} name="signup-target" label={c.target} value={state.values.target} type="text" inputMode="numeric" required hint={c.targetHint} error={errors.target} onChange={event => change({ target: event.target.value })}/>
        <SelectField ref={cadenceRef} name="cadence" label={c.cadence} value={state.values.cadence} required options={[{ value: 'daily', label: c.daily }, { value: 'weekly', label: c.weekly }, { value: 'monthly', label: c.monthly }]} error={errors.cadence} onChange={event => change({ cadence: event.target.value })}/>
      </div>
      <div className="kk-control-options">
        <Checkbox label={c.comparison} description={c.comparisonHint} checked={state.values.comparison} onChange={event => change({ comparison: event.target.checked })}/>
        <Switch label={c.alerts} description={c.alertsHint} checked={state.values.alerts} onCheckedChange={alerts => change({ alerts })}/>
      </div>
      {Object.keys(errors).length > 0 && <p role="alert" className="kk-control-error-summary">{c.invalid}</p>}
      {state.saved && <>{state.noticeVisible && <Notification tone="success" title={c.saved} message={c.savedNote} onDismiss={() => dispatch({ type: 'dismiss' })} dismissLabel={c.dismiss}/>}<div className="kk-control-saved"><h4>{c.savedSnapshot}</h4><dl className="kk-control-summary"><div><dt>{c.name}</dt><dd>{state.saved.name}</dd></div><div><dt>{c.target}</dt><dd>{Number(state.saved.target).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}</dd></div><div><dt>{c.cadence}</dt><dd>{state.saved.cadence === 'daily' ? c.daily : state.saved.cadence === 'monthly' ? c.monthly : c.weekly}</dd></div></dl></div></>}
    </Panel>
  </form>;
}

function ReportResults({ filters, locale }: { filters: ReportFilters; locale: KitLocale }) {
  const c = controlCopy(locale), rows = filterReports(sampleReports(locale), filters);
  return <div>
    <div className="kk-control-result-heading"><p role="status" aria-live="polite">{rows.length} {c.resultLabel}</p></div>
    {rows.length === 0 ? <p className="kk-control-empty">{c.noResults}</p> : <ul className="kk-control-result-list">{rows.map(row => <li key={row.id}><div><strong>{row.name}</strong><small>{row.scope}</small></div><Badge tone={row.status === 'watch' ? 'warning' : 'positive'}>{row.status === 'watch' ? c.watch : c.healthy}</Badge></li>)}</ul>}
  </div>;
}

function FiltersExample({ locale }: { locale: KitLocale }) {
  const c = controlCopy(locale), [filters, setFilters] = useState<ReportFilters>({ ...defaultReportFilters });
  return <Panel title={c.filterTitle} description={c.filterSubtitle} locale={locale} footer={<><p>{c.synthetic}</p><Button onClick={() => setFilters({ ...defaultReportFilters })}>{c.reset}</Button></>}>
    <div className="kk-control-filter-fields">
      <InputField type="search" label={c.search} placeholder={c.searchPlaceholder} value={filters.query} onChange={event => setFilters({ ...filters, query: event.target.value })}/>
      <SelectField label={c.category} value={filters.category} options={[{ value: 'all', label: c.all }, { value: 'revenue', label: c.revenue }, { value: 'customers', label: c.customers }, { value: 'operations', label: c.operations }]} onChange={event => setFilters({ ...filters, category: event.target.value })}/>
    </div>
    <div className="kk-control-chip-row" role="group" aria-label={locale === 'ko' ? '리포트 상태' : 'Report status'}>{(['all', 'healthy', 'watch'] as const).map(status => <FilterChip key={status} pressed={filters.status === status} onClick={() => setFilters({ ...filters, status })}>{c[status]}</FilterChip>)}</div>
    <ReportResults filters={filters} locale={locale}/>
  </Panel>;
}

function Details({ locale }: { locale: KitLocale }) {
  const c = controlCopy(locale);
  return <dl className="kk-control-summary"><div><dt>{c.source}</dt><dd>{c.sourceValue}</dd></div><div><dt>{c.scope}</dt><dd>{c.scopeValue}</dd></div><div><dt>{c.refresh}</dt><dd>{c.refreshValue}</dd></div></dl>;
}

function DialogExample({ locale }: { locale: KitLocale }) {
  const c = controlCopy(locale), [open, setOpen] = useState(false), [closed, setClosed] = useState(false);
  const close = () => { setOpen(false); setClosed(true); };
  return <Panel title={c.dialogTitle} description={c.dialogSubtitle} locale={locale} footer={<><p>{c.localNote}</p><Button variant="primary" onClick={() => { setClosed(false); setOpen(true); }}>{c.openDialog}</Button></>}>
    <Details locale={locale}/>
    <p className="kk-control-event" role="status">{closed ? c.dialogClosed : c.dialogHint}</p>
    <Dialog open={open} onClose={close} title={c.dialogTitle} closeLabel={c.close}>
      <div className="kk-control-dialog-detail"><Details locale={locale}/><p className="kk-control-note">{c.dialogHint}</p></div>
      <div className="kk-control-actions"><Button onClick={close}>{c.done}</Button></div>
    </Dialog>
  </Panel>;
}

function ConfirmExample({ locale }: { locale: KitLocale }) {
  const c = controlCopy(locale), [state, dispatch] = useReducer(transitionConfirmation, undefined, initialConfirmationState);
  const category = state.filters.category === 'revenue' ? c.revenue : c.all, status = state.filters.status === 'watch' ? c.watch : c.all;
  return <Panel title={c.confirmTitle} description={c.confirmSubtitle} locale={locale} footer={<><p>{c.localNote}</p><div className="kk-control-actions"><Button onClick={() => dispatch('restore')}>{c.restore}</Button><Button variant="primary" onClick={() => dispatch('open')}>{c.requestReset}</Button></div></>}>
    <dl className="kk-control-summary"><div><dt>{c.category}</dt><dd>{category}</dd></div><div><dt>{locale === 'ko' ? '상태' : 'Status'}</dt><dd>{status}</dd></div></dl>
    <ReportResults filters={state.filters} locale={locale}/>
    <p className="kk-control-event" role="status">{state.outcome === 'cancelled' ? c.cancelled : state.outcome === 'confirmed' ? c.confirmed : c.confirmMessage}</p>
    <ConfirmDialog open={state.open} title={c.confirmQuestion} message={c.confirmMessage} cancelLabel={c.cancel} confirmLabel={c.confirm} closeLabel={c.close} onCancel={() => dispatch('cancel')} onConfirm={() => dispatch('confirm')}/>
  </Panel>;
}

function NotificationExample({ locale }: { locale: KitLocale }) {
  const c = controlCopy(locale), [visible, dispatch] = useReducer(transitionNotification, true);
  return <Panel title={c.noticeTitle} description={c.noticeSubtitle} locale={locale} footer={<><p>{c.localNote}</p><Button disabled={visible} onClick={() => dispatch('show')}>{c.show}</Button></>}>
    {visible ? <Notification tone="success" title={c.noticeHeading} message={c.noticeMessage} onDismiss={() => dispatch('dismiss')} dismissLabel={c.dismiss}/> : <p className="kk-control-empty" role="status">{c.dismissed}</p>}
  </Panel>;
}

function TooltipExample({ locale }: { locale: KitLocale }) {
  const c = controlCopy(locale);
  return <Panel title={c.tooltipTitle} description={c.tooltipSubtitle} locale={locale} footer={<div className="kk-control-shortcuts"><span><kbd>↗</kbd>{c.tooltipHover}</span><span><kbd>Tab</kbd>{c.tooltipFocus}</span></div>}>
    <div className="kk-control-tooltip-stage"><Tooltip label={c.tooltipText}><Button onClick={event => event.currentTarget.focus()}>{c.tooltipTrigger}<span aria-hidden="true"> ⓘ</span></Button></Tooltip></div>
    <p className="kk-control-note">{c.tooltipNote}</p>
  </Panel>;
}

/** Exactly one isolated interactive example is mounted at a time. */
export function ControlStudio({ kind, locale }: { kind: ControlKind; locale: KitLocale }) {
  const examples = { form: FormExample, filters: FiltersExample, dialog: DialogExample, confirm: ConfirmExample, notification: NotificationExample, tooltip: TooltipExample };
  const Example = examples[kind];
  return <div className="kk-control-studio" data-control-kind={kind}><Example key={kind} locale={locale}/></div>;
}
