import type { KitLocale } from '../kit/contracts.js';
import type { AsyncStateKind, ErrorPageKind, StateKind } from '../kit/ui/feedback.js';
export type { StateKind } from '../kit/ui/feedback.js';

export const stateDataKinds: AsyncStateKind[] = ['loading', 'empty', 'no-results', 'error', 'offline', 'stale', 'partial'];
export const statePageKinds: ErrorPageKind[] = ['403', '404', '500', 'maintenance'];
export const stateKinds: StateKind[] = [...stateDataKinds, ...statePageKinds];
export interface StateExample { id: StateKind; label: string; description: string; group: 'data' | 'page' }
export function stateExamples(locale: KitLocale): StateExample[] {
  const entries: Record<StateKind, [string, string]> = locale === 'ko' ? {
    loading: ['로딩 · 스켈레톤', '값을 추측하지 않고 요청 처리 중임을 표시합니다.'],
    empty: ['빈 데이터', '원본에 기록이 없는 경우에 사용합니다.'],
    'no-results': ['검색 결과 없음', '원본 데이터와 필터 결과를 구분합니다.'],
    error: ['요청 오류', '실패한 요청의 재시도와 재실패를 확인합니다.'],
    offline: ['오프라인', '연결 불가와 저장된 스냅샷을 함께 표시합니다.'],
    stale: ['오래된 데이터', '기존 값과 스냅샷 시각을 유지합니다.'],
    partial: ['일부 데이터', '누락 범위를 알리고 확인된 값은 유지합니다.'],
    '403': ['403 · 접근 제한', '권한 문제를 재시도 가능한 서버 오류와 구분합니다.'],
    '404': ['404 · 페이지 없음', '잘못되거나 더 이상 없는 주소를 안내합니다.'],
    '500': ['500 · 서버 오류', '서버 요청의 실패와 복구 동작을 표시합니다.'],
    maintenance: ['점검 안내', '확인되지 않은 복구 시간을 약속하지 않습니다.'],
  } : {
    loading: ['Loading / skeleton', 'Show a pending request without inventing a value.'],
    empty: ['Empty source', 'Use when the source has no records in scope.'],
    'no-results': ['No search results', 'Distinguish filtered results from an empty source.'],
    error: ['Request error', 'Exercise retry success and repeated request failure.'],
    offline: ['Offline', 'Keep a saved snapshot available while disconnected.'],
    stale: ['Stale data', 'Retain known values and their snapshot timestamp.'],
    partial: ['Partial data', 'Show available values and the missing scope together.'],
    '403': ['403 / Access denied', 'Separate missing permission from a retryable server fault.'],
    '404': ['404 / Not found', 'Help recover from an incorrect or removed address.'],
    '500': ['500 / Server error', 'Explain a failed server request and offer recovery.'],
    maintenance: ['Maintenance', 'Communicate downtime without inventing an ETA.'],
  };
  return stateKinds.map(id => ({ id, label: entries[id][0], description: entries[id][1], group: statePageKinds.includes(id as ErrorPageKind) ? 'page' : 'data' }));
}

export type StateDemoPhase = StateKind | 'ready' | 'returned';
export type StateDemoOutcome = 'success' | 'failure';
export interface StateDemoModel {
  origin: StateKind;
  phase: StateDemoPhase;
  /** The failure state to restore after an explicitly completed simulated request. */
  pendingKind: StateKind | null;
  outcome: StateDemoOutcome;
  attempts: number;
  query: string;
}
export type StateDemoEvent =
  | { type: 'retry' }
  | { type: 'complete' }
  | { type: 'outcome'; outcome: StateDemoOutcome }
  | { type: 'reset' }
  | { type: 'query'; query: string }
  | { type: 'clear-filters' }
  | { type: 'load-sample' }
  | { type: 'back' };
export interface StateDemoRow { id: string; en: string; ko: string; value: number | null }
const fixtureRows: StateDemoRow[] = [
  { id: 'east', en: 'East region', ko: '동부 지역', value: 128 },
  { id: 'west', en: 'West region', ko: '서부 지역', value: 94 },
  { id: 'central', en: 'Central region', ko: '중부 지역', value: 83 },
];
function matchingRows(query: string): StateDemoRow[] {
  const search = query.trim().toLocaleLowerCase();
  return fixtureRows.filter(row => `${row.id} ${row.en} ${row.ko}`.toLocaleLowerCase().includes(search)).map(row => ({ ...row }));
}
export function createStateDemo(kind: StateKind): StateDemoModel {
  return { origin: kind, phase: kind, pendingKind: kind === 'loading' ? 'error' : null, outcome: 'success', attempts: 0, query: kind === 'no-results' ? 'zz-no-match' : '' };
}
export function canRetryState(kind: StateDemoPhase): boolean {
  return ['error', 'offline', 'stale', 'partial', '500', 'maintenance'].includes(kind);
}
/** The studio dispatches these exact events. There are no timers, fetches or access mutations. */
export function stateDemoReducer(state: StateDemoModel, event: StateDemoEvent): StateDemoModel {
  switch (event.type) {
    case 'reset': return createStateDemo(state.origin);
    case 'outcome': return { ...state, outcome: event.outcome };
    case 'retry': return canRetryState(state.phase) ? { ...state, pendingKind: state.phase as StateKind, phase: 'loading', attempts: state.attempts + 1 } : state;
    case 'complete': return state.phase === 'loading' ? { ...state, phase: state.outcome === 'success' ? 'ready' : state.pendingKind ?? 'error', pendingKind: null } : state;
    case 'load-sample': return state.phase === 'empty' ? { ...state, phase: 'loading', pendingKind: 'error', attempts: state.attempts + 1 } : state;
    case 'query': {
      if (state.origin !== 'no-results') return state;
      return { ...state, query: event.query, phase: matchingRows(event.query).length ? 'ready' : 'no-results', pendingKind: null };
    }
    case 'clear-filters': return state.origin === 'no-results' ? { ...state, query: '', phase: 'ready', pendingKind: null } : state;
    case 'back': return statePageKinds.includes(state.origin as ErrorPageKind) && state.phase !== 'returned' ? { ...state, phase: 'returned', pendingKind: null } : state;
  }
}
/** Previous values survive refresh and re-failure; a missing region stays null. */
export function stateDemoRows(state: StateDemoModel): StateDemoRow[] {
  if (state.phase === 'ready') return matchingRows(state.query);
  if (state.phase === 'returned' || state.phase === '403' || state.phase === '404') return [];
  if (state.origin === 'stale' || state.origin === 'offline') return fixtureRows.map((row, index) => ({ ...row, value: [121, 88, 79][index] }));
  if (state.origin === 'partial') return fixtureRows.map(row => ({ ...row, value: row.id === 'central' ? null : row.value }));
  return [];
}
export function stateDemoSnapshot(state: StateDemoModel): string | null {
  if (state.phase === 'ready') return '2026-09-30 09:00 UTC';
  if (state.origin === 'stale' || state.origin === 'offline') return '2026-09-28 09:00 UTC';
  if (state.origin === 'partial') return '2026-09-30 09:00 UTC';
  return null;
}

/** Standalone interactive TSX with a local reducer; parity is checked against the live reducer. */
export function stateSnippet(kind: StateKind, locale: KitLocale): string {
  const ko = locale === 'ko';
  const t = (en: string, kr: string) => ko ? kr : en;
  const copy = {
    note: t('Local simulation only. No network requests, permission changes or real navigation.', '로컬 시뮬레이션입니다. 네트워크 요청, 권한 변경, 실제 페이지 이동은 없습니다.'),
    outcome: t('Simulated result', '시뮬레이션 결과'), success: t('Success', '성공'), failure: t('Fail again', '다시 실패'),
    complete: t('Complete simulated request', '시뮬레이션 요청 완료'), retry: t('Simulate retry', '재시도 시뮬레이션'), reset: t('Reset example', '예제 초기화'),
    clear: t('Clear filters', '필터 초기화'), sample: t('Load sample rows', '예제 기록 불러오기'), back: t('Simulate going back', '이전 화면 시뮬레이션'),
    ready: t('Sample data ready', '예제 데이터 준비 완료'), returned: t('Previous demo screen', '이전 예제 화면'),
    returnedDetail: t('Only this preview changed. Resource permissions have not changed.', '이 미리보기만 바뀌었습니다. 리소스 권한은 바뀌지 않았습니다.'),
    source: t('Synthetic regional requests', '지역별 요청 합성 데이터'), count: t('requests', '요청'), missing: t('Unavailable, not zero', '확인되지 않음 · 0이 아님'),
    query: t('Search sample regions', '예제 지역 검색'), matching: t('of 3 match', '/ 3개 일치'),
    snapshot: t('Snapshot time · fixed fixture', '스냅샷 시각 · 고정 예제'), coverage: t('Coverage', '수집 범위'), partial: t('2 of 3 regions; no complete total', '3개 지역 중 2개 · 전체 합계 없음'),
    sourceRecords: t('Source records', '원본 기록'), empty: t('0 records in this scope', '현재 범위에 기록 0개'),
    filtered: t('3 available / 0 matching', '기존 기록 3개 / 검색 결과 0개'),
    paused: t('Request paused for inspection. Complete it manually; no timer or network is running.', '요청 상태를 확인한 뒤 직접 완료하세요. 타이머나 네트워크 요청은 실행되지 않습니다.'),
    failed: t('Simulated request failed again. The original state remains.', '시뮬레이션 요청이 다시 실패했습니다. 원래 상태를 유지합니다.'),
  };
  return `import React, { useReducer } from 'react';
import { AsyncState, ErrorPage, Button } from './kit/index.js';
import type { StateKind, StateAction, StateMetadata } from './kit/index.js';
import './kit/styles.css';

type Model = {
  origin: StateKind;
  phase: StateKind | 'ready' | 'returned';
  pendingKind: StateKind | null;
  outcome: 'success' | 'failure';
  attempts: number;
  query: string;
};
type Event =
  | { type: 'retry' | 'complete' | 'reset' | 'clear-filters' | 'load-sample' | 'back' }
  | { type: 'outcome'; outcome: 'success' | 'failure' }
  | { type: 'query'; query: string };
type Row = { id: string; en: string; ko: string; value: number | null };
const copy = ${JSON.stringify(copy, null, 2)};
const sampleRows: Row[] = ${JSON.stringify(fixtureRows, null, 2)};
export const initialModel: Model = ${JSON.stringify(createStateDemo(kind), null, 2)};
const pageKinds: StateKind[] = ['403', '404', '500', 'maintenance'];
const canRetry = (phase: Model['phase']) => ['error', 'offline', 'stale', 'partial', '500', 'maintenance'].includes(phase);
const matchingRows = (query: string) => sampleRows.filter(row =>
  (row.id + ' ' + row.en + ' ' + row.ko).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
).map(row => ({ ...row }));

// Local events only. Wire your own data layer to the reusable UI in your application.
export function reduceExample(model: Model, event: Event): Model {
  switch (event.type) {
    case 'reset': return { ...initialModel };
    case 'outcome': return { ...model, outcome: event.outcome };
    case 'retry': return canRetry(model.phase)
      ? { ...model, phase: 'loading', pendingKind: model.phase as StateKind, attempts: model.attempts + 1 } : model;
    case 'complete': return model.phase === 'loading'
      ? { ...model, phase: model.outcome === 'success' ? 'ready' : model.pendingKind ?? 'error', pendingKind: null } : model;
    case 'load-sample': return model.phase === 'empty'
      ? { ...model, phase: 'loading', pendingKind: 'error', attempts: model.attempts + 1 } : model;
    case 'query': return model.origin === 'no-results'
      ? { ...model, query: event.query, phase: matchingRows(event.query).length ? 'ready' : 'no-results', pendingKind: null } : model;
    case 'clear-filters': return model.origin === 'no-results'
      ? { ...model, query: '', phase: 'ready', pendingKind: null } : model;
    case 'back': return pageKinds.includes(model.origin) && model.phase !== 'returned'
      ? { ...model, phase: 'returned', pendingKind: null } : model;
  }
}
export function exampleRows(model: Model): Row[] {
  if (model.phase === 'ready') return matchingRows(model.query);
  if (['returned', '403', '404'].includes(model.phase)) return [];
  if (model.origin === 'stale' || model.origin === 'offline')
    return sampleRows.map((row, index) => ({ ...row, value: [121, 88, 79][index] }));
  if (model.origin === 'partial')
    return sampleRows.map(row => ({ ...row, value: row.id === 'central' ? null : row.value }));
  return [];
}

export default function Example() {
  const [model, dispatch] = useReducer(reduceExample, initialModel);
  const phase = model.phase;
  const rows = exampleRows(model);
  const snapshot = phase === 'ready' || model.origin === 'partial' ? '2026-09-30 09:00 UTC'
    : ['stale', 'offline'].includes(model.origin) ? '2026-09-28 09:00 UTC' : null;
  const actions: StateAction[] = [];
  const metadata: StateMetadata[] = [];
  if (snapshot) metadata.push({ label: copy.snapshot, value: snapshot });
  if (rows.some(row => row.value === null)) metadata.push({ label: copy.coverage, value: copy.partial });
  if (phase === 'empty') metadata.push({ label: copy.sourceRecords, value: copy.empty });
  if (phase === 'no-results') metadata.push({ label: copy.sourceRecords, value: copy.filtered });
  if (canRetry(phase)) actions.push({ label: copy.retry, onAction: () => dispatch({ type: 'retry' }), variant: 'primary' });
  if (phase === 'empty') actions.push({ label: copy.sample, onAction: () => dispatch({ type: 'load-sample' }), variant: 'primary' });
  if (phase === 'no-results') actions.push({ label: copy.clear, onAction: () => dispatch({ type: 'clear-filters' }), variant: 'primary' });
  if (pageKinds.includes(model.origin) && phase !== 'returned' && phase !== 'ready')
    actions.push({ label: copy.back, onAction: () => dispatch({ type: 'back' }) });
  const evidence = rows.length > 0 && <section className="kk-state-evidence" aria-label={copy.source}>
    <h3>{copy.source}</h3>
    <dl>{rows.map(row => <div key={row.id}><dt>{row.${ko ? 'ko' : 'en'}}</dt>
      <dd>{row.value === null ? '—' : row.value}<small>{row.value === null ? copy.missing : copy.count}</small></dd>
    </div>)}</dl>
  </section>;
  return (
    <div className="kk-root kk-state-studio">
      <p className="kk-state-studio-note">{copy.note}</p>
      {model.origin === 'no-results' && <label className="kk-state-query">{copy.query}
        <input type="search" value={model.query} onChange={event => dispatch({ type: 'query', query: event.target.value })} />
        <span>{rows.length} {copy.matching}</span>
      </label>}
      {phase === 'ready' ? <section className="kk-state-demo-result"><h3>{copy.ready}</h3><p>{copy.snapshot}: {snapshot}</p>{evidence}</section>
        : phase === 'returned' ? <section className="kk-state-demo-result"><h3>{copy.returned}</h3><p>{copy.returnedDetail}</p></section>
        : phase === '403' || phase === '404' || phase === '500' || phase === 'maintenance'
          ? <ErrorPage kind={phase} locale="${locale}" actions={actions} metadata={metadata} />
          : <AsyncState kind={phase} locale="${locale}" actions={actions} metadata={metadata}>{evidence}</AsyncState>}
      <div className="kk-state-demo-controls">
        {!['403', '404', 'no-results'].includes(model.origin) && <label>{copy.outcome}
          <select value={model.outcome} onChange={event => dispatch({ type: 'outcome', outcome: event.target.value as 'success' | 'failure' })}>
            <option value="success">{copy.success}</option><option value="failure">{copy.failure}</option>
          </select>
        </label>}
        {phase === 'loading' && <Button variant="primary" onClick={() => dispatch({ type: 'complete' })}>{copy.complete}</Button>}
        <Button onClick={() => dispatch({ type: 'reset' })}>{copy.reset}</Button>
      </div>
      <p role="status">{phase === 'loading' ? copy.paused : model.attempts > 0 && phase !== 'ready' && phase !== 'returned' ? copy.failed : ''}</p>
    </div>
  );
}
`;
}
