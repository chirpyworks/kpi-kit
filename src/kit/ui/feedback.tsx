import React, { useId } from 'react';
import type { KitLocale } from '../contracts.js';
import { Button } from './primitives.js';

export type AsyncStateKind = 'loading' | 'empty' | 'no-results' | 'error' | 'offline' | 'stale' | 'partial';
export type ErrorPageKind = '403' | '404' | '500' | 'maintenance';
export type StateKind = AsyncStateKind | ErrorPageKind;

/** Copy is presentation, never evidence that a request, permission or connection changed. */
export interface StateContent {
  title: string;
  description: string;
  detail?: string;
}
export interface StateMetadata {
  label: string;
  value: React.ReactNode;
}
export interface StateAction {
  label: string;
  onAction: () => void;
  variant?: 'default' | 'primary' | 'quiet';
  disabled?: boolean;
}
export interface AsyncStateProps {
  kind: AsyncStateKind;
  locale?: KitLocale;
  content?: Partial<StateContent>;
  metadata?: readonly StateMetadata[];
  actions?: readonly StateAction[];
  /** Retained evidence stays outside the live region, including during revalidation. */
  children?: React.ReactNode;
  className?: string;
}
export interface ErrorPageProps {
  kind: ErrorPageKind;
  locale?: KitLocale;
  content?: Partial<StateContent>;
  metadata?: readonly StateMetadata[];
  actions?: readonly StateAction[];
  headingLevel?: 1 | 2 | 3;
  className?: string;
}

const content: Record<KitLocale, Record<StateKind, StateContent>> = {
  en: {
    loading: { title: 'Loading data', description: 'The request is still in progress.', detail: 'No result is available yet. Missing values are not zero.' },
    empty: { title: 'No data yet', description: 'This source has no records for the selected scope.', detail: 'Add data or select a scope with available records.' },
    'no-results': { title: 'No matching results', description: 'Data is available, but nothing matches your current filters.', detail: 'Clear or adjust the filters to see available records.' },
    error: { title: 'Data could not be loaded', description: 'The request failed before a usable result was returned.', detail: 'Try the request again. This is not an empty dataset.' },
    offline: { title: 'Connection unavailable', description: 'A new result cannot be retrieved while the connection is unavailable.', detail: 'Check your connection, then try again. Any saved data remains available below.' },
    stale: { title: 'Showing an earlier snapshot', description: 'The available data is older than the expected refresh window.', detail: 'Use the recorded snapshot time when interpreting these values.' },
    partial: { title: 'Some data is unavailable', description: 'Only part of the requested scope is available.', detail: 'Available values are not a complete total. Missing records have not been replaced with zero.' },
    '403': { title: 'You do not have access', description: 'This resource requires a permission your current session does not have.', detail: 'Ask the resource owner for access, or return to a page you can open. Retrying does not grant permission.' },
    '404': { title: 'Page not found', description: 'We could not find a resource at this address.', detail: 'Check the address or return to the previous page.' },
    '500': { title: 'Something went wrong', description: 'The server could not complete this request.', detail: 'Try again, or return to the previous page. Your request did not produce a usable result.' },
    maintenance: { title: 'Temporarily unavailable', description: 'This service is undergoing planned maintenance.', detail: 'Try again later. A restoration time has not been confirmed.' },
  },
  ko: {
    loading: { title: '데이터를 불러오는 중', description: '아직 요청을 처리하고 있습니다.', detail: '결과가 아직 없습니다. 누락된 값을 0으로 처리하지 않습니다.' },
    empty: { title: '아직 데이터가 없습니다', description: '선택한 범위의 원본에 기록이 없습니다.', detail: '데이터를 추가하거나 기록이 있는 범위를 선택하세요.' },
    'no-results': { title: '일치하는 결과가 없습니다', description: '데이터는 있지만 현재 필터와 일치하는 기록이 없습니다.', detail: '필터를 초기화하거나 조건을 바꾸면 기존 기록을 볼 수 있습니다.' },
    error: { title: '데이터를 불러오지 못했습니다', description: '사용할 수 있는 결과를 받기 전에 요청이 실패했습니다.', detail: '요청을 다시 시도하세요. 데이터가 없는 상태와는 다릅니다.' },
    offline: { title: '연결을 사용할 수 없습니다', description: '연결이 끊긴 동안에는 새 결과를 받을 수 없습니다.', detail: '연결을 확인한 뒤 다시 시도하세요. 저장된 데이터가 있다면 아래에 유지됩니다.' },
    stale: { title: '이전 스냅샷을 표시합니다', description: '사용 가능한 데이터가 예상 갱신 주기보다 오래되었습니다.', detail: '표시된 스냅샷 시각을 기준으로 값을 해석하세요.' },
    partial: { title: '일부 데이터를 받지 못했습니다', description: '요청한 범위의 일부 데이터만 사용할 수 있습니다.', detail: '표시된 값은 전체 합계가 아닙니다. 누락된 기록을 0으로 대체하지 않습니다.' },
    '403': { title: '접근 권한이 없습니다', description: '이 리소스에 필요한 권한이 현재 세션에 없습니다.', detail: '리소스 소유자에게 접근 권한을 요청하거나 열 수 있는 페이지로 돌아가세요. 재시도로 권한이 생기지는 않습니다.' },
    '404': { title: '페이지를 찾을 수 없습니다', description: '이 주소에서 리소스를 찾을 수 없습니다.', detail: '주소를 확인하거나 이전 페이지로 돌아가세요.' },
    '500': { title: '요청을 처리하지 못했습니다', description: '서버가 이 요청을 완료하지 못했습니다.', detail: '다시 시도하거나 이전 페이지로 돌아가세요. 사용할 수 있는 결과를 받지 못했습니다.' },
    maintenance: { title: '서비스 점검 중입니다', description: '예정된 점검으로 서비스를 잠시 사용할 수 없습니다.', detail: '잠시 후 다시 시도하세요. 복구 시각은 아직 확인되지 않았습니다.' },
  },
};

export function getStateContent(kind: StateKind, locale: KitLocale = 'en'): StateContent {
  return { ...content[locale][kind] };
}

const symbols: Record<AsyncStateKind, string> = {
  loading: '…', empty: '∅', 'no-results': '⌕', error: '!', offline: '↯', stale: '◷', partial: '◐',
};

function Metadata({ items }: { items?: readonly StateMetadata[] }) {
  if (!items?.length) return null;
  return <dl className="kk-feedback-meta">{items.map((item, index) => <div key={`${item.label}-${index}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}
function Actions({ actions }: { actions?: readonly StateAction[] }) {
  if (!actions?.length) return null;
  return <div className="kk-feedback-actions">{actions.map((action, index) => <Button key={`${action.label}-${index}`} variant={action.variant} disabled={action.disabled} onClick={action.onAction}>{action.label}</Button>)}</div>;
}

export interface SkeletonProps {
  variant?: 'text' | 'card' | 'table';
  lines?: number;
  /** Omit inside an already-labelled loading state to keep decoration silent. */
  label?: string;
  className?: string;
}
export function Skeleton({ variant = 'card', lines = 3, label, className = '' }: SkeletonProps) {
  const count = Number.isFinite(lines) ? Math.max(1, Math.min(12, Math.floor(lines))) : 3;
  return <div className={`kk-skeleton kk-skeleton--${variant} ${className}`} role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    {variant === 'card' && <span className="kk-skeleton-block kk-skeleton-value" />}
    {Array.from({ length: count }, (_, index) => <span key={index} className="kk-skeleton-block kk-skeleton-line" />)}
  </div>;
}

/** A labelled message plus optional retained data. Consumers own request lifecycles. */
export function AsyncState({ kind, locale = 'en', content: override, metadata, actions, children, className = '' }: AsyncStateProps) {
  const id = useId();
  const copy = { ...getStateContent(kind, locale), ...override };
  return <section className={`kk-async-state kk-async-state--${kind} ${className}`} data-state={kind} aria-labelledby={`${id}-title`}>
    <div className="kk-feedback-message" role={kind === 'error' ? 'alert' : 'status'} aria-live={kind === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
      <span className="kk-feedback-symbol" aria-hidden="true">{symbols[kind]}</span>
      <div className="kk-feedback-copy"><h3 id={`${id}-title`}>{copy.title}</h3><p>{copy.description}</p>{copy.detail && <p className="kk-feedback-detail">{copy.detail}</p>}</div>
    </div>
    <Metadata items={metadata} />
    {kind === 'loading' && !children && <div className="kk-feedback-loading" aria-busy="true"><Skeleton variant="table" lines={3} /></div>}
    <Actions actions={actions} />
    {children && <div className="kk-feedback-data" aria-busy={kind === 'loading'}>{children}</div>}
  </section>;
}

/** Embed as a page body, without introducing a second main landmark. No navigation is implicit. */
export function ErrorPage({ kind, locale = 'en', content: override, metadata, actions, headingLevel = 1, className = '' }: ErrorPageProps) {
  const id = useId();
  const copy = { ...getStateContent(kind, locale), ...override };
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3';
  return <section className={`kk-error-page kk-error-page--${kind} ${className}`} data-state={kind} aria-labelledby={`${id}-title`}>
    <div className="kk-error-page-symbol" aria-hidden="true">{kind === 'maintenance' ? '503' : kind}</div>
    <div className="kk-error-page-copy" role={kind === '500' ? 'alert' : 'status'} aria-atomic="true">
      <span className="kk-feedback-eyebrow">{kind === 'maintenance' ? (locale === 'ko' ? '예정된 점검' : 'Scheduled maintenance') : `HTTP ${kind}`}</span>
      <Heading id={`${id}-title`}>{copy.title}</Heading>
      <p>{copy.description}</p>{copy.detail && <p className="kk-feedback-detail">{copy.detail}</p>}
    </div>
    <Metadata items={metadata} />
    <Actions actions={actions} />
  </section>;
}
