import type { KitLocale } from '../kit/contracts.js';

export type ControlKind = 'form' | 'filters' | 'dialog' | 'confirm' | 'notification' | 'tooltip';
export const controlKinds: ControlKind[] = ['form', 'filters', 'dialog', 'confirm', 'notification', 'tooltip'];

export function controlExamples(locale: KitLocale): { id: ControlKind; label: string; description: string }[] {
  const ko = locale === 'ko';
  const labels = ko ? ['입력 폼', '검색과 필터', '대화상자', '확인 대화상자', '알림', '툴팁'] : ['Input form', 'Search & filters', 'Dialog', 'Confirmation', 'Notification', 'Tooltip'];
  const descriptions = ko
    ? ['필드 검증과 메모리 내 샘플 저장', '검색·선택·상태 필터를 결합한 결과', '상세 정보와 명확한 닫기 동작', '변경 전 확인과 안전한 취소', '상태 안내, 닫기와 다시 표시', '포인터와 키보드로 보는 짧은 설명']
    : ['Field validation and an in-memory sample save', 'Combined search, select and status filtering', 'Focused details with an explicit close action', 'Review a change and cancel safely', 'Semantic feedback, dismissal and replay', 'A short explanation on hover or keyboard focus'];
  return controlKinds.map((id, index) => ({ id, label: labels[index], description: descriptions[index] }));
}

export function controlCopy(locale: KitLocale) {
  const ko = locale === 'ko';
  return ko ? {
    sample: '로컬 샘플', title: '리포트 설정', subtitle: '입력, 검증, 피드백이 이어지는 작은 설정 폼입니다.',
    name: '리포트 이름', nameHint: '3~64자로 입력하세요.', namePlaceholder: '주간 성과 리포트',
    target: '목표 가입 수', targetHint: '1~100,000 사이의 정수 · 단위: 명', cadence: '집계 주기',
    daily: '매일', weekly: '매주', monthly: '매월', comparison: '이전 기간 비교 포함', comparisonHint: '같은 길이의 이전 기간을 비교합니다.',
    alerts: '주의 상태 강조', alertsHint: '이 샘플 화면의 표시 옵션입니다.', save: '샘플 저장', fill: '예시 값 입력',
    nameError: '리포트 이름을 3~64자로 입력하세요.', targetError: '목표 가입 수를 1~100,000 사이의 정수로 입력하세요.', cadenceError: '집계 주기를 선택하세요.',
    invalid: '입력한 값을 확인하세요. 잘못된 첫 번째 필드로 이동했습니다.', saved: '샘플이 저장되었습니다', savedSnapshot: '저장된 샘플 값',
    savedNote: '이 예제의 메모리에만 저장됩니다. 실제 서버에 저장되지 않으며 화면을 나가거나 새로고침하면 초기화됩니다.',
    localNote: '실제 서버에 연결되지 않은 메모리 내 샘플입니다.',
    filterTitle: '리포트 탐색', filterSubtitle: '검색어, 카테고리, 상태를 함께 적용합니다.', search: '리포트 검색', searchPlaceholder: '이름으로 검색', category: '카테고리',
    all: '전체', revenue: '매출', customers: '고객', operations: '운영', healthy: '정상', watch: '주의', reset: '필터 초기화',
    noResults: '조건에 맞는 리포트가 없습니다. 검색어나 필터를 변경하세요.', resultLabel: '개 리포트', synthetic: '합성 샘플 · 실제 고객 데이터 없음',
    dialogTitle: '리포트 상세', dialogSubtitle: '현재 설정을 살펴보고 원래 화면으로 돌아갑니다.', openDialog: '상세 정보 열기', close: '닫기', done: '확인',
    dialogHint: '포커스는 대화상자 안에 유지됩니다. Escape 또는 닫기로 돌아갈 수 있습니다.', dialogClosed: '대화상자를 닫았습니다. 설정은 변경되지 않았습니다.',
    source: '데이터 소스', sourceValue: '내장 합성 데이터', scope: '조회 기간', scopeValue: '2026.09.01 – 2026.09.07', refresh: '갱신 방식', refreshValue: '로컬 정적 샘플',
    confirmTitle: '샘플 필터 초기화', confirmSubtitle: '동작의 영향을 먼저 보여주고 명시적으로 확인합니다.', requestReset: '초기화 검토',
    confirmQuestion: '샘플 필터를 초기화할까요?', confirmMessage: '이 예제의 검색어, 카테고리, 상태를 기본값으로 되돌립니다. 리포트 데이터는 변경되지 않습니다.',
    cancel: '취소', confirm: '필터 초기화', cancelled: '취소했습니다. 기존 샘플 필터를 유지합니다.', confirmed: '샘플 필터를 초기화했습니다.', restore: '예시 필터 복원',
    noticeTitle: '상태 알림', noticeSubtitle: '결과는 스크린 리더에도 전달되며, 직접 닫을 수 있습니다.',
    noticeHeading: '미리보기 준비 완료', noticeMessage: '합성 리포트 4개를 불러왔습니다. 서버 요청이나 외부 알림 전송은 없습니다.',
    dismiss: '알림 닫기', dismissed: '알림을 닫았습니다.', show: '알림 다시 표시',
    tooltipTitle: '문맥 도움말', tooltipSubtitle: '짧은 정의를 필요한 위치에서 확인합니다.', tooltipTrigger: '데이터 최신성 안내',
    tooltipText: '데이터 최신성은 마지막 갱신 시점을 의미하며 데이터의 완전성과는 별개입니다.', tooltipNote: '버튼에 마우스를 올리거나 키보드 포커스를 이동하세요. 모바일에서는 버튼을 눌러 도움말을 확인하세요.',
    tooltipOpened: '도움말 버튼에 포커스가 있습니다.', tooltipHover: '마우스 올리기', tooltipFocus: '키보드 포커스',
  } : {
    sample: 'LOCAL SAMPLE', title: 'Report settings', subtitle: 'A compact settings form with validation and clear feedback.',
    name: 'Report name', nameHint: 'Use 3–64 characters.', namePlaceholder: 'Weekly performance',
    target: 'Signup target', targetHint: 'Whole number from 1 to 100,000 · unit: people', cadence: 'Reporting cadence',
    daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', comparison: 'Include prior-period comparison', comparisonHint: 'Compare the previous period of the same length.',
    alerts: 'Highlight watch states', alertsHint: 'A display option for this sample only.', save: 'Save sample', fill: 'Fill sample values',
    nameError: 'Enter a report name with 3–64 characters.', targetError: 'Enter a whole-number signup target from 1 to 100,000.', cadenceError: 'Choose a reporting cadence.',
    invalid: 'Check the highlighted values. Focus moved to the first invalid field.', saved: 'Sample saved', savedSnapshot: 'Saved sample snapshot',
    savedNote: 'Stored only in this example’s memory. Nothing is saved to a real server; leaving this example or refreshing resets it.',
    localNote: 'An in-memory sample with no real backend connection.',
    filterTitle: 'Browse reports', filterSubtitle: 'Combine a search query, category and status filter.', search: 'Search reports', searchPlaceholder: 'Search by name', category: 'Category',
    all: 'All', revenue: 'Revenue', customers: 'Customers', operations: 'Operations', healthy: 'Healthy', watch: 'Watch', reset: 'Reset filters',
    noResults: 'No reports match these filters. Try another search or reset the filters.', resultLabel: 'reports', synthetic: 'Synthetic samples · no real customer data',
    dialogTitle: 'Report details', dialogSubtitle: 'Inspect the current setup and return to your context.', openDialog: 'Open report details', close: 'Close', done: 'Done',
    dialogHint: 'Focus stays inside the dialog. Press Escape or Close to return.', dialogClosed: 'Dialog closed. No settings were changed.',
    source: 'Data source', sourceValue: 'Built-in synthetic data', scope: 'Reporting period', scopeValue: 'Sep 01 – Sep 07, 2026', refresh: 'Refresh mode', refreshValue: 'Local static sample',
    confirmTitle: 'Reset sample filters', confirmSubtitle: 'Explain the effect before requesting explicit confirmation.', requestReset: 'Review reset',
    confirmQuestion: 'Reset the sample filters?', confirmMessage: 'This resets the example’s query, category and status to their defaults. Report data stays unchanged.',
    cancel: 'Cancel', confirm: 'Reset filters', cancelled: 'Cancelled. The existing sample filters were kept.', confirmed: 'Sample filters were reset.', restore: 'Restore sample filters',
    noticeTitle: 'Status notification', noticeSubtitle: 'Announce an outcome to screen readers and allow manual dismissal.',
    noticeHeading: 'Preview is ready', noticeMessage: 'Loaded 4 synthetic reports. No server request or external notification was sent.',
    dismiss: 'Dismiss notification', dismissed: 'Notification dismissed.', show: 'Show notification again',
    tooltipTitle: 'Contextual help', tooltipSubtitle: 'Keep a short definition close to the item it explains.', tooltipTrigger: 'About data freshness',
    tooltipText: 'Freshness describes the last update time. It is separate from data completeness.', tooltipNote: 'Hover over the button or focus it with your keyboard. On mobile, tap the button to focus the help text.',
    tooltipOpened: 'The help button has focus.', tooltipHover: 'Hover', tooltipFocus: 'Keyboard focus',
  };
}

export interface ReportFormValues { name: string; target: string; cadence: string; comparison: boolean; alerts: boolean }
export type FormErrors = Partial<Record<'name' | 'target' | 'cadence', string>>;
export interface ReportFormState { values: ReportFormValues; errors: FormErrors; submitted: boolean; saved: ReportFormValues | null; noticeVisible: boolean }
export type ReportFormAction = { type: 'change'; values: Partial<ReportFormValues> } | { type: 'submit' } | { type: 'fill' } | { type: 'dismiss' };
export function sampleFormValues(): ReportFormValues { return { name: 'Weekly performance', target: '2500', cadence: 'weekly', comparison: true, alerts: false }; }
export function initialFormState(): ReportFormState { return { values: { ...sampleFormValues(), name: '' }, errors: {}, submitted: false, saved: null, noticeVisible: false }; }
export function validateReportForm(values: ReportFormValues, locale: KitLocale): FormErrors {
  const c = controlCopy(locale), errors: FormErrors = {};
  if (values.name.trim().length < 3 || values.name.trim().length > 64) errors.name = c.nameError;
  if (!/^\d+$/.test(values.target.trim()) || Number(values.target) < 1 || Number(values.target) > 100000) errors.target = c.targetError;
  if (!['daily', 'weekly', 'monthly'].includes(values.cadence)) errors.cadence = c.cadenceError;
  return errors;
}
export function transitionReportForm(state: ReportFormState, action: ReportFormAction, locale: KitLocale): ReportFormState {
  if (action.type === 'dismiss') return { ...state, noticeVisible: false };
  if (action.type === 'fill') return { ...state, values: { ...sampleFormValues(), name: controlCopy(locale).namePlaceholder }, errors: {}, submitted: false, noticeVisible: false };
  const values = action.type === 'change' ? { ...state.values, ...action.values } : state.values;
  const submitted = action.type === 'submit' || state.submitted;
  const errors = submitted ? validateReportForm(values, locale) : {};
  const validSubmit = action.type === 'submit' && Object.keys(errors).length === 0;
  return { values, errors, submitted, saved: validSubmit ? { ...values, name: values.name.trim(), target: String(Number(values.target)) } : state.saved, noticeVisible: validSubmit };
}

export interface ReportFilters { query: string; category: string; status: string }
export interface SampleReport { id: string; name: string; category: 'revenue' | 'customers' | 'operations'; status: 'healthy' | 'watch'; scope: string }
export const defaultReportFilters: ReportFilters = { query: '', category: 'all', status: 'all' };
export const activeReportFilters: ReportFilters = { query: '', category: 'revenue', status: 'watch' };
export function sampleReports(locale: KitLocale): SampleReport[] {
  const ko = locale === 'ko';
  return [
    { id: 'report-01', name: ko ? '주간 매출' : 'Weekly revenue', category: 'revenue', status: 'healthy', scope: ko ? '최근 7일 · 합성 샘플' : 'Last 7 days · synthetic sample' },
    { id: 'report-02', name: ko ? '매출 회수 현황' : 'Revenue recovery', category: 'revenue', status: 'watch', scope: ko ? '최근 30일 · 합성 샘플' : 'Last 30 days · synthetic sample' },
    { id: 'report-03', name: ko ? '고객 유지 현황' : 'Customer retention', category: 'customers', status: 'healthy', scope: ko ? '최근 30일 · 합성 샘플' : 'Last 30 days · synthetic sample' },
    { id: 'report-04', name: ko ? '운영 처리량' : 'Operations throughput', category: 'operations', status: 'watch', scope: ko ? '최근 7일 · 합성 샘플' : 'Last 7 days · synthetic sample' },
  ];
}
export function filterReports(rows: readonly SampleReport[], filters: ReportFilters): SampleReport[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return rows.filter(row => row.name.toLocaleLowerCase().includes(query) && (filters.category === 'all' || row.category === filters.category) && (filters.status === 'all' || row.status === filters.status));
}
export interface ConfirmationState { filters: ReportFilters; open: boolean; outcome: 'idle' | 'cancelled' | 'confirmed' }
export function initialConfirmationState(): ConfirmationState { return { filters: { ...activeReportFilters }, open: false, outcome: 'idle' }; }
export function transitionConfirmation(state: ConfirmationState, action: 'open' | 'cancel' | 'confirm' | 'restore'): ConfirmationState {
  if (action === 'restore') return initialConfirmationState();
  if (action === 'open') return { ...state, open: true, outcome: 'idle' };
  if (!state.open) return state;
  if (action === 'cancel') return { ...state, open: false, outcome: 'cancelled' };
  return { filters: { ...defaultReportFilters }, open: false, outcome: 'confirmed' };
}
export function transitionNotification(visible: boolean, action: 'show' | 'dismiss'): boolean { return action === 'show' ? true : action === 'dismiss' ? false : visible; }

/** Inspector data is a declared local contract, never a claim of server persistence. */
export function controlData(kind: ControlKind, locale: KitLocale) {
  const example = controlExamples(locale).find(item => item.id === kind)!;
  return { ...example, persistence: 'memory-only', backend: null, ...(kind === 'filters' || kind === 'confirm' ? { rows: sampleReports(locale), initialFilters: kind === 'confirm' ? activeReportFilters : defaultReportFilters } : kind === 'form' ? { initialValues: initialFormState().values, validation: { name: '3–64 trimmed characters', target: 'integer 1–100000', cadence: ['daily', 'weekly', 'monthly'] } } : {}) };
}

const panelSource = `function Panel({ title, description, children, footer }: { title: string; description: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <section className="kk-control-panel">
    <header className="kk-control-panel-header"><div><h3>{title}</h3><p>{description}</p></div><Badge>{c.sample}</Badge></header>
    <div className="kk-control-panel-body">{children}</div>
    {footer && <footer className="kk-control-panel-footer">{footer}</footer>}
  </section>;
}`;
const formSource = `export interface FormValues { name: string; target: string; cadence: string; comparison: boolean; alerts: boolean }
export type FormErrors = Partial<Record<'name' | 'target' | 'cadence', string>>;
export interface FormState { values: FormValues; errors: FormErrors; submitted: boolean; saved: FormValues | null; noticeVisible: boolean }
export type FormAction = { type: 'change'; values: Partial<FormValues> } | { type: 'submit' } | { type: 'fill' } | { type: 'dismiss' };
export function sampleFormValues(): FormValues { return { name: 'Weekly performance', target: '2500', cadence: 'weekly', comparison: true, alerts: false }; }
export function initialFormState(): FormState { return { values: { ...sampleFormValues(), name: '' }, errors: {}, submitted: false, saved: null, noticeVisible: false }; }
export function validateReportForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (values.name.trim().length < 3 || values.name.trim().length > 64) errors.name = c.nameError;
  if (!/^\\d+$/.test(values.target.trim()) || Number(values.target) < 1 || Number(values.target) > 100000) errors.target = c.targetError;
  if (!['daily', 'weekly', 'monthly'].includes(values.cadence)) errors.cadence = c.cadenceError;
  return errors;
}
export function transitionReportForm(state: FormState, action: FormAction): FormState {
  if (action.type === 'dismiss') return { ...state, noticeVisible: false };
  if (action.type === 'fill') return { ...state, values: { ...sampleFormValues(), name: c.namePlaceholder }, errors: {}, submitted: false, noticeVisible: false };
  const values = action.type === 'change' ? { ...state.values, ...action.values } : state.values;
  const submitted = action.type === 'submit' || state.submitted;
  const errors = submitted ? validateReportForm(values) : {};
  const validSubmit = action.type === 'submit' && Object.keys(errors).length === 0;
  return { values, errors, submitted, saved: validSubmit ? { ...values, name: values.name.trim(), target: String(Number(values.target)) } : state.saved, noticeVisible: validSubmit };
}
function Demo() {
  const [state, dispatch] = useReducer(transitionReportForm, undefined, initialFormState);
  const nameRef = useRef<HTMLInputElement>(null), targetRef = useRef<HTMLInputElement>(null), cadenceRef = useRef<HTMLSelectElement>(null);
  const errors = state.submitted ? validateReportForm(state.values) : {};
  const change = (values: Partial<FormValues>) => dispatch({ type: 'change', values });
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = transitionReportForm(state, { type: 'submit' });
    dispatch({ type: 'submit' });
    if (next.errors.name) nameRef.current?.focus();
    else if (next.errors.target) targetRef.current?.focus();
    else if (next.errors.cadence) cadenceRef.current?.focus();
  }
  return <form noValidate onSubmit={submit}>
    <Panel title={c.title} description={c.subtitle} footer={<><p>{c.localNote}</p><div className="kk-control-actions"><Button onClick={() => dispatch({ type: 'fill' })}>{c.fill}</Button><Button type="submit" variant="primary">{c.save}</Button></div></>}>
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
      {state.saved && <>{state.noticeVisible && <Notification tone="success" title={c.saved} message={c.savedNote} onDismiss={() => dispatch({ type: 'dismiss' })} dismissLabel={c.dismiss}/>}<div className="kk-control-saved"><h4>{c.savedSnapshot}</h4><dl className="kk-control-summary"><div><dt>{c.name}</dt><dd>{state.saved.name}</dd></div><div><dt>{c.target}</dt><dd>{Number(state.saved.target).toLocaleString(LOCALE === 'ko' ? 'ko-KR' : 'en-US')}</dd></div><div><dt>{c.cadence}</dt><dd>{state.saved.cadence === 'daily' ? c.daily : state.saved.cadence === 'monthly' ? c.monthly : c.weekly}</dd></div></dl></div></>}
    </Panel>
  </form>;
}`;
const resultsSource = `export interface ReportFilters { query: string; category: string; status: string }
export const defaultReportFilters: ReportFilters = { query: '', category: 'all', status: 'all' };
export function filterReports(rows: typeof reports, filters: ReportFilters) {
  const query = filters.query.trim().toLocaleLowerCase();
  return rows.filter(row => row.name.toLocaleLowerCase().includes(query) && (filters.category === 'all' || row.category === filters.category) && (filters.status === 'all' || row.status === filters.status));
}
function ReportResults({ filters }: { filters: ReportFilters }) {
  const rows = filterReports(reports, filters);
  return <div>
    <div className="kk-control-result-heading"><p role="status" aria-live="polite">{rows.length} {c.resultLabel}</p></div>
    {rows.length === 0 ? <p className="kk-control-empty">{c.noResults}</p> : <ul className="kk-control-result-list">{rows.map(row => <li key={row.id}><div><strong>{row.name}</strong><small>{row.scope}</small></div><Badge tone={row.status === 'watch' ? 'warning' : 'positive'}>{row.status === 'watch' ? c.watch : c.healthy}</Badge></li>)}</ul>}
  </div>;
}`;
const filtersSource = `function Demo() {
  const [filters, setFilters] = useState<ReportFilters>({ ...defaultReportFilters });
  return <Panel title={c.filterTitle} description={c.filterSubtitle} footer={<><p>{c.synthetic}</p><Button onClick={() => setFilters({ ...defaultReportFilters })}>{c.reset}</Button></>}>
    <div className="kk-control-filter-fields">
      <InputField type="search" label={c.search} placeholder={c.searchPlaceholder} value={filters.query} onChange={event => setFilters({ ...filters, query: event.target.value })}/>
      <SelectField label={c.category} value={filters.category} options={[{ value: 'all', label: c.all }, { value: 'revenue', label: c.revenue }, { value: 'customers', label: c.customers }, { value: 'operations', label: c.operations }]} onChange={event => setFilters({ ...filters, category: event.target.value })}/>
    </div>
    <div className="kk-control-chip-row" role="group" aria-label={LOCALE === 'ko' ? '리포트 상태' : 'Report status'}>{(['all', 'healthy', 'watch'] as const).map(status => <FilterChip key={status} pressed={filters.status === status} onClick={() => setFilters({ ...filters, status })}>{c[status]}</FilterChip>)}</div>
    <ReportResults filters={filters}/>
  </Panel>;
}`;
const detailsSource = `function Details() {
  return <dl className="kk-control-summary"><div><dt>{c.source}</dt><dd>{c.sourceValue}</dd></div><div><dt>{c.scope}</dt><dd>{c.scopeValue}</dd></div><div><dt>{c.refresh}</dt><dd>{c.refreshValue}</dd></div></dl>;
}
function Demo() {
  const [open, setOpen] = useState(false), [closed, setClosed] = useState(false);
  const close = () => { setOpen(false); setClosed(true); };
  return <Panel title={c.dialogTitle} description={c.dialogSubtitle} footer={<><p>{c.localNote}</p><Button variant="primary" onClick={() => { setClosed(false); setOpen(true); }}>{c.openDialog}</Button></>}>
    <Details/>
    <p className="kk-control-event" role="status">{closed ? c.dialogClosed : c.dialogHint}</p>
    <Dialog open={open} onClose={close} title={c.dialogTitle} closeLabel={c.close}>
      <div className="kk-control-dialog-detail"><Details/><p className="kk-control-note">{c.dialogHint}</p></div>
      <div className="kk-control-actions"><Button onClick={close}>{c.done}</Button></div>
    </Dialog>
  </Panel>;
}`;
const confirmSource = `export interface ConfirmationState { filters: ReportFilters; open: boolean; outcome: 'idle' | 'cancelled' | 'confirmed' }
export function initialConfirmationState(): ConfirmationState { return { filters: { query: '', category: 'revenue', status: 'watch' }, open: false, outcome: 'idle' }; }
export function transitionConfirmation(state: ConfirmationState, action: 'open' | 'cancel' | 'confirm' | 'restore'): ConfirmationState {
  if (action === 'restore') return initialConfirmationState();
  if (action === 'open') return { ...state, open: true, outcome: 'idle' };
  if (!state.open) return state;
  if (action === 'cancel') return { ...state, open: false, outcome: 'cancelled' };
  return { filters: { ...defaultReportFilters }, open: false, outcome: 'confirmed' };
}
function Demo() {
  const [state, dispatch] = useReducer(transitionConfirmation, undefined, initialConfirmationState);
  const category = state.filters.category === 'revenue' ? c.revenue : c.all, status = state.filters.status === 'watch' ? c.watch : c.all;
  return <Panel title={c.confirmTitle} description={c.confirmSubtitle} footer={<><p>{c.localNote}</p><div className="kk-control-actions"><Button onClick={() => dispatch('restore')}>{c.restore}</Button><Button variant="primary" onClick={() => dispatch('open')}>{c.requestReset}</Button></div></>}>
    <dl className="kk-control-summary"><div><dt>{c.category}</dt><dd>{category}</dd></div><div><dt>{LOCALE === 'ko' ? '상태' : 'Status'}</dt><dd>{status}</dd></div></dl>
    <ReportResults filters={state.filters}/>
    <p className="kk-control-event" role="status">{state.outcome === 'cancelled' ? c.cancelled : state.outcome === 'confirmed' ? c.confirmed : c.confirmMessage}</p>
    <ConfirmDialog open={state.open} title={c.confirmQuestion} message={c.confirmMessage} cancelLabel={c.cancel} confirmLabel={c.confirm} closeLabel={c.close} onCancel={() => dispatch('cancel')} onConfirm={() => dispatch('confirm')}/>
  </Panel>;
}`;
const notificationSource = `export function transitionNotification(visible: boolean, action: 'show' | 'dismiss'): boolean { return action === 'show' ? true : action === 'dismiss' ? false : visible; }
function Demo() {
  const [visible, dispatch] = useReducer(transitionNotification, true);
  return <Panel title={c.noticeTitle} description={c.noticeSubtitle} footer={<><p>{c.localNote}</p><Button disabled={visible} onClick={() => dispatch('show')}>{c.show}</Button></>}>
    {visible ? <Notification tone="success" title={c.noticeHeading} message={c.noticeMessage} onDismiss={() => dispatch('dismiss')} dismissLabel={c.dismiss}/> : <p className="kk-control-empty" role="status">{c.dismissed}</p>}
  </Panel>;
}`;
const tooltipSource = `function Demo() {
  return <Panel title={c.tooltipTitle} description={c.tooltipSubtitle} footer={<div className="kk-control-shortcuts"><span><kbd>↗</kbd>{c.tooltipHover}</span><span><kbd>Tab</kbd>{c.tooltipFocus}</span></div>}>
    <div className="kk-control-tooltip-stage"><Tooltip label={c.tooltipText}><Button onClick={event => event.currentTarget.focus()}>{c.tooltipTrigger}<span aria-hidden="true"> ⓘ</span></Button></Tooltip></div>
    <p className="kk-control-note">{c.tooltipNote}</p>
  </Panel>;
}`;

/** Complete TSX: paste next to a copied kit directory; every action stays local. */
export function controlSnippet(kind: ControlKind, locale: KitLocale): string {
  const sources: Record<ControlKind, string> = { form: formSource, filters: resultsSource + '\n\n' + filtersSource, dialog: detailsSource, confirm: resultsSource + '\n\n' + confirmSource, notification: notificationSource, tooltip: tooltipSource };
  const components: Record<ControlKind, string> = { form: 'Badge, Button, Checkbox, Switch, InputField, SelectField, Notification', filters: 'Badge, Button, FilterChip, InputField, SelectField', dialog: 'Badge, Button, Dialog', confirm: 'Badge, Button, ConfirmDialog', notification: 'Badge, Button, Notification', tooltip: 'Badge, Button, Tooltip' };
  const source = panelSource + '\n\n' + sources[kind];
  const copy = controlCopy(locale);
  const usedKeys = new Set([...source.matchAll(/c\.([A-Za-z]+)/g)].map(match => match[1]));
  if (kind === 'filters') ['all', 'healthy', 'watch'].forEach(key => usedKeys.add(key));
  const text = Object.fromEntries(Object.entries(copy).filter(([key]) => usedKeys.has(key)));
  return `import React, { useReducer, useRef, useState } from 'react';
import { ${components[kind]} } from './kit/index.js';
import './kit/styles.css';

// Local synthetic example. No request, persistence or subscription is created.
const LOCALE: 'en' | 'ko' = ${JSON.stringify(locale)};
const c = ${JSON.stringify(text, null, 2)};
${kind === 'filters' || kind === 'confirm' ? '\nconst reports = ' + JSON.stringify(sampleReports(locale), null, 2) + ';\n' : ''}
${source}

export default function Example() {
  return <div className="kk-root"><div className="kk-control-studio" data-control-kind="${kind}"><Demo/></div></div>;
}
`;
}
