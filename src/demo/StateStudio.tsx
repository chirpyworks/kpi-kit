import React, { useReducer } from 'react';
import type { KitLocale } from '../kit/contracts.js';
import { AsyncState, ErrorPage } from '../kit/ui/feedback.js';
import type { AsyncStateKind, ErrorPageKind, StateAction, StateMetadata } from '../kit/ui/feedback.js';
import { Button } from '../kit/ui/primitives.js';
import {
  canRetryState, createStateDemo, stateDemoReducer, stateDemoRows, stateDemoSnapshot, statePageKinds,
} from './state-examples.js';
import type { StateDemoEvent, StateDemoModel, StateKind } from './state-examples.js';

export interface StateStudioProps { kind: StateKind; locale: KitLocale }

function StateEvidence({ model, locale }: { model: StateDemoModel; locale: KitLocale }) {
  const ko = locale === 'ko';
  const rows = stateDemoRows(model);
  if (!rows.length) return null;
  const partial = rows.some(row => row.value === null);
  return <section className="kk-state-evidence" aria-label={ko ? '사용 가능한 예제 데이터' : 'Available sample data'}>
    <h3>{ko ? '지역별 요청' : 'Requests by region'}</h3>
    <p>{ko ? '합성 데이터 · 지역별 건수 · 누락은 0이 아닙니다' : 'Synthetic data · counts by region · missing is not zero'}{partial && (ko ? ' · 전체 합계 미제공' : ' · complete total withheld')}</p>
    <dl>{rows.map(row => <div key={row.id} data-region={row.id} data-missing={row.value === null}>
      <dt>{ko ? row.ko : row.en}</dt><dd>{row.value === null ? '—' : row.value}<small>{row.value === null ? (ko ? '확인되지 않음 · 0이 아님' : 'Unavailable, not zero') : (ko ? '요청 건수' : 'requests')}</small></dd>
    </div>)}</dl>
  </section>;
}

/** Exported to SSR the same view used by the interactive reducer, including after transitions. */
export function StateDemoView({ model, locale, onEvent }: { model: StateDemoModel; locale: KitLocale; onEvent: (event: StateDemoEvent) => void }) {
  const ko = locale === 'ko';
  const t = (en: string, kr: string) => ko ? kr : en;
  const phase = model.phase;
  const isPage = statePageKinds.includes(phase as ErrorPageKind);
  const originalPage = statePageKinds.includes(model.origin as ErrorPageKind);
  const snapshot = stateDemoSnapshot(model);
  const rows = stateDemoRows(model);
  const metadata: StateMetadata[] = [];
  const actions: StateAction[] = [];
  if (snapshot) metadata.push({ label: t('Snapshot time · fixed fixture', '스냅샷 시각 · 고정 예제'), value: snapshot });
  if (rows.some(row => row.value === null)) metadata.push({ label: t('Coverage', '수집 범위'), value: t('2 of 3 regions · no complete total', '3개 지역 중 2개 · 전체 합계 없음') });
  if (phase === 'stale' || phase === 'offline') metadata.push({ label: t('Source', '원본'), value: t('Saved synthetic snapshot', '저장된 합성 스냅샷') });
  if (phase === 'empty') metadata.push({ label: t('Source records', '원본 기록'), value: t('0 records in this scope', '현재 범위에 기록 0개') });
  if (phase === 'no-results') metadata.push({ label: t('Source / matching records', '원본 / 일치하는 기록'), value: t('3 available / 0 matching', '기존 기록 3개 / 검색 결과 0개') });
  if (phase === '403') metadata.push({ label: t('Example resource', '예제 리소스'), value: '/reports/restricted' });
  if (phase === '404') metadata.push({ label: t('Example address', '예제 주소'), value: '/reports/unknown' });
  if (phase === '500') metadata.push({ label: t('Demo reference', '예제 참조'), value: 'DEMO-500' });
  if (phase === 'maintenance') metadata.push({ label: t('Restoration time', '복구 시각'), value: t('Not confirmed in this example', '이 예제에서는 확인되지 않음') });
  if (canRetryState(phase)) actions.push({ label: t('Simulate retry', '재시도 시뮬레이션'), onAction: () => onEvent({ type: 'retry' }), variant: 'primary' });
  if (phase === 'empty') actions.push({ label: t('Load sample rows', '예제 기록 불러오기'), onAction: () => onEvent({ type: 'load-sample' }), variant: 'primary' });
  if (phase === 'no-results') actions.push({ label: t('Clear filters', '필터 초기화'), onAction: () => onEvent({ type: 'clear-filters' }), variant: 'primary' });
  if (originalPage && phase !== 'returned' && phase !== 'ready') actions.push({ label: t('Simulate going back', '이전 화면 시뮬레이션'), onAction: () => onEvent({ type: 'back' }), variant: phase === '403' || phase === '404' ? 'primary' : 'default' });
  const isSimulatable = !['403', '404', 'no-results'].includes(model.origin);
  const message = phase === 'loading'
    ? t('Request paused for inspection. Complete it manually below; no timer or network is running.', '요청 상태를 살펴볼 수 있도록 대기 중입니다. 아래에서 직접 완료하세요. 타이머나 네트워크 요청은 실행되지 않습니다.')
    : phase === 'ready'
      ? t('Simulation completed with sample data. No real source was changed.', '예제 데이터로 시뮬레이션을 완료했습니다. 실제 원본은 바뀌지 않았습니다.')
      : phase === 'returned'
        ? t('Only this preview changed. No browser navigation or permission change occurred.', '이 미리보기만 바뀌었습니다. 브라우저 이동이나 권한 변경은 없습니다.')
        : model.attempts > 0
          ? t(`Simulated request failed again · ${model.attempts} attempt${model.attempts === 1 ? '' : 's'}. The original state remains.`, `시뮬레이션 요청이 다시 실패했습니다 · ${model.attempts}회 시도. 원래 상태를 유지합니다.`)
          : t('Try the recovery action, or reset to repeat this scenario.', '복구 동작을 눌러보거나 초기화하여 같은 상황을 반복해 보세요.');

  return <div className="kk-state-studio" data-demo-origin={model.origin} data-demo-phase={phase}>
    <div className="kk-state-studio-toolbar">
      <span className="kk-state-demo-label"><i aria-hidden="true" />{t('LOCAL SIMULATION', '로컬 시뮬레이션')}</span>
      <Button variant="quiet" onClick={() => onEvent({ type: 'reset' })}>{t('Reset example', '예제 초기화')}</Button>
    </div>
    <p className="kk-state-studio-note">{t('Synthetic fixtures only. Actions do not send network requests, grant access, reconnect a service or navigate your browser.', '합성 데이터만 사용합니다. 버튼으로 네트워크를 요청하거나 권한을 부여하거나 서비스를 재연결하거나 실제 페이지를 이동하지 않습니다.')}</p>
    {model.origin === 'no-results' && <label className="kk-state-query">
      <span>{t('Search sample regions', '예제 지역 검색')}</span>
      <input type="search" value={model.query} onChange={event => onEvent({ type: 'query', query: event.target.value })} placeholder={t('East, West, Central', '동부, 서부, 중부')} />
      <span>{t(`${rows.length} of 3 match`, `3개 중 ${rows.length}개 일치`)}</span>
    </label>}
    {phase === 'ready' ? <section className="kk-state-demo-result" aria-label={t('Successful demo result', '예제 성공 결과')}>
      <h3>{t('Sample data ready', '예제 데이터 준비 완료')}</h3>
      <p>{t('A local success result is shown below. Snapshot:', '로컬 성공 결과를 표시합니다. 스냅샷:')} {snapshot}</p>
      <StateEvidence model={model} locale={locale} />
    </section> : phase === 'returned' ? <section className="kk-state-demo-result" aria-label={t('Previous demo screen', '이전 예제 화면')}>
      <h3>{t('Back to the demo overview', '예제 개요로 돌아왔습니다')}</h3>
      <p>{model.origin === '403' ? t('The restricted resource remains inaccessible. Going back does not change permissions.', '제한된 리소스의 권한은 그대로입니다. 돌아가기로 접근 권한이 바뀌지 않습니다.') : t('This is a local placeholder for your application’s previous screen.', '앱의 이전 화면을 나타내는 로컬 예제입니다.')}</p>
      <Button onClick={() => onEvent({ type: 'reset' })}>{t('Show error page again', '오류 페이지 다시 보기')}</Button>
    </section> : isPage ? <ErrorPage kind={phase as ErrorPageKind} locale={locale} headingLevel={2} metadata={metadata} actions={actions} />
      : <AsyncState kind={phase as AsyncStateKind} locale={locale} metadata={metadata} actions={actions}
          content={phase === 'loading' ? { description: t('A simulated request is waiting for manual completion.', '시뮬레이션 요청을 직접 완료할 수 있습니다.'), detail: rows.length ? t('The previous snapshot remains visible while this request is pending.', '요청이 대기 중인 동안 이전 스냅샷을 유지합니다.') : t('Skeletons reserve space without inventing values.', '스켈레톤은 값을 추측하지 않고 표시 공간을 유지합니다.') } : undefined}>
          {rows.length > 0 && <StateEvidence model={model} locale={locale} />}
        </AsyncState>}
    {isSimulatable && <div className="kk-state-demo-controls">
      <label>{t('Simulated result', '시뮬레이션 결과')}<select value={model.outcome} onChange={event => onEvent({ type: 'outcome', outcome: event.target.value as 'success' | 'failure' })}>
        <option value="success">{t('Success', '성공')}</option><option value="failure">{t('Fail again', '다시 실패')}</option>
      </select></label>
      {phase === 'loading' && <Button variant="primary" onClick={() => onEvent({ type: 'complete' })}>{t('Complete simulated request', '시뮬레이션 요청 완료')}</Button>}
    </div>}
    <p className="kk-state-demo-announcement" role="status" aria-live="polite">{message}</p>
  </div>;
}
function StateScenario({ kind, locale }: StateStudioProps) {
  const [model, dispatch] = useReducer(stateDemoReducer, kind, createStateDemo);
  return <StateDemoView model={model} locale={locale} onEvent={dispatch} />;
}
/** A new selected kind has fresh local state; changing language keeps its current step. */
export function StateStudio({ kind, locale }: StateStudioProps) {
  return <StateScenario key={kind} kind={kind} locale={locale} />;
}
