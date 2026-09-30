import React, { useId } from 'react';
import type { KitLocale } from '../contracts.js';
import { Button } from './primitives.js';

export interface BreadcrumbItem {
  id: string;
  label: string;
  /** HTTP(S) or a relative path/query/fragment. Unsafe URLs render as non-interactive text. */
  href?: string;
  onClick?: () => void;
}
export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  label?: string;
  locale?: KitLocale;
}
const unsafeUrlCharacters = /[\u0000-\u001f\u007f-\u009f\\]/;
/** Validate before React receives the URL; React 18 only warns about script URLs. */
function safeBreadcrumbHref(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.trim() !== value || unsafeUrlCharacters.test(value)) return false;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(value)?.[1];
  if (scheme && !/^https?$/i.test(scheme)) return false;
  if (!scheme) {
    // A path without an explicit scheme cannot have a colon in its first segment.
    // Reject encoded scheme-like prefixes too; callers can use ./ for literal path names.
    if (/^[^/?#]*&(?:#(?:x[\da-f]+|\d+)|[a-z][a-z\d]*);/i.test(value)) return false;
    const firstSegment = value.split(/[/?#]/, 1)[0];
    try {
      const decoded = decodeURIComponent(firstSegment);
      if (decoded.includes(':') || unsafeUrlCharacters.test(decoded)
        || /&(?:#(?:x[\da-f]+|\d+)|[a-z][a-z\d]*);/i.test(decoded)) return false;
    } catch { return false; }
  }
  try {
    const url = new URL(value, 'https://kpi-kit.invalid/');
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch { return false; }
}

/** The final item is current. An unsafe href never becomes a link or an action fallback. */
export function Breadcrumbs({ items, label, locale = 'en' }: BreadcrumbsProps) {
  if (!items.length) return null;
  return <nav className="kk-breadcrumbs" aria-label={label ?? (locale === 'ko' ? '이동 경로' : 'Breadcrumbs')}><ol>{items.map((item, index) => {
    const hasHref = item.href !== undefined && item.href !== '';
    return <li key={item.id}>
    {index > 0 && <span className="kk-breadcrumb-separator" aria-hidden="true">/</span>}
    {index === items.length - 1 ? <span aria-current="page">{item.label}</span>
      : hasHref ? safeBreadcrumbHref(item.href) ? <a href={item.href} onClick={item.onClick}>{item.label}</a> : <span>{item.label}</span>
        : item.onClick ? <button type="button" onClick={item.onClick}>{item.label}</button> : <span>{item.label}</span>}
  </li>; })}</ol></nav>;
}

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  headingLevel?: 1 | 2 | 3;
}
export function PageHeader({ title, description, eyebrow, breadcrumbs, actions, headingLevel = 1 }: PageHeaderProps) {
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3';
  return <header className="kk-page-header">{breadcrumbs}<div className="kk-page-header-row"><div className="kk-page-header-copy">{eyebrow && <span className="kk-page-eyebrow">{eyebrow}</span>}<Heading>{title}</Heading>{description && <p>{description}</p>}</div>{actions && <div className="kk-page-header-actions">{actions}</div>}</div></header>;
}

export interface SideNavigationItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}
export interface SideNavigationProps<T extends string = string> {
  items: readonly SideNavigationItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
}
/** Controlled local-view navigation. Route links can instead be supplied to DashboardShell's navigation slot. */
export function SideNavigation<T extends string>({ items, value, onValueChange, label }: SideNavigationProps<T>) {
  return <nav className="kk-side-navigation" aria-label={label}><span className="kk-side-navigation-label">{label}</span><ul>{items.map(item => <li key={item.id}><button type="button" disabled={item.disabled} aria-current={value === item.id ? 'page' : undefined} onClick={() => onValueChange(item.id)}>{item.icon && <span className="kk-side-navigation-icon" aria-hidden="true">{item.icon}</span>}<span>{item.label}</span>{item.badge !== undefined && <span className="kk-side-navigation-badge">{item.badge}</span>}</button></li>)}</ul></nav>;
}

export interface DashboardShellProps {
  navigation: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  detail?: React.ReactNode;
  footer?: React.ReactNode;
  label: string;
}
/** A contained, embeddable layout; it deliberately does not introduce a second main landmark. */
export function DashboardShell({ navigation, header, children, detail, footer, label }: DashboardShellProps) {
  return <section className="kk-dashboard-shell" aria-label={label}><div className="kk-dashboard-shell-grid"><div className="kk-dashboard-shell-navigation">{navigation}</div><div className="kk-dashboard-shell-content">{header}<div className="kk-dashboard-shell-body" data-has-detail={!!detail}><div className="kk-dashboard-shell-primary">{children}</div>{detail && <div className="kk-dashboard-shell-detail">{detail}</div>}</div>{footer && <footer className="kk-dashboard-shell-footer">{footer}</footer>}</div></div></section>;
}

export interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel?: string;
  locale?: KitLocale;
  id?: string;
}
/** Non-modal supporting detail: no overlay or focus trap. The caller owns focus return when closing. */
export function DetailPanel({ open, onClose, title, description, children, footer, closeLabel, locale = 'en', id }: DetailPanelProps) {
  const titleId = useId();
  if (!open) return null;
  return <aside className="kk-detail-panel" id={id} aria-labelledby={titleId}><div className="kk-detail-panel-heading"><div><h3 id={titleId}>{title}</h3>{description && <p>{description}</p>}</div><Button variant="quiet" onClick={onClose} aria-label={closeLabel ?? (locale === 'ko' ? '상세 패널 닫기' : 'Close detail panel')}><span aria-hidden="true">×</span></Button></div><div className="kk-detail-panel-body">{children}</div>{footer && <footer className="kk-detail-panel-footer">{footer}</footer>}</aside>;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  from: number;
  to: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
export interface PaginationInput { page: number; pageSize: number; totalItems: number }
/** One-based page, zero-based slice indices. A changing result count safely clamps a stale page. */
export function getPaginationState({ page, pageSize, totalItems }: PaginationInput): PaginationState {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new RangeError('pageSize must be a positive safe integer.');
  if (!Number.isSafeInteger(totalItems) || totalItems < 0) throw new RangeError('totalItems must be a non-negative safe integer.');
  const totalPages = Math.ceil(totalItems / pageSize);
  const current = Math.min(Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1), Math.max(1, totalPages));
  const startIndex = (current - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  return { page: current, pageSize, totalItems, totalPages, startIndex, endIndex, from: totalItems ? startIndex + 1 : 0, to: endIndex, hasPrevious: current > 1, hasNext: current < totalPages };
}
export interface PaginationProps extends PaginationInput {
  onPageChange: (page: number) => void;
  locale?: KitLocale;
  label?: string;
}
export function Pagination({ page, pageSize, totalItems, onPageChange, locale = 'en', label }: PaginationProps) {
  const state = getPaginationState({ page, pageSize, totalItems });
  const ko = locale === 'ko';
  const first = Math.max(1, Math.min(state.page - 2, state.totalPages - 4));
  const pages = Array.from({ length: Math.min(5, state.totalPages) }, (_, i) => first + i);
  const pageLabel = (value: number) => ko ? `${value}페이지` : `Page ${value}`;
  const go = (value: number) => onPageChange(getPaginationState({ page: value, pageSize, totalItems }).page);
  return <nav className="kk-pagination" aria-label={label ?? (ko ? '페이지 이동' : 'Pagination')}><span className="kk-pagination-summary" role="status" aria-atomic="true">{ko ? `총 ${totalItems.toLocaleString('ko-KR')}개 중 ${state.from}–${state.to}` : `${state.from}–${state.to} of ${totalItems.toLocaleString('en-US')} results`}</span><div className="kk-pagination-controls">
    <Button disabled={!state.hasPrevious} onClick={() => go(state.page - 1)} aria-label={ko ? '이전 페이지' : 'Previous page'}>{ko ? '이전' : 'Previous'}</Button>
    {first > 1 && <><Button onClick={() => go(1)} aria-label={pageLabel(1)}>1</Button>{first > 2 && <span className="kk-pagination-gap" aria-hidden="true">…</span>}</>}
    {pages.map(value => <Button key={value} aria-label={pageLabel(value)} aria-current={value === state.page ? 'page' : undefined} onClick={() => go(value)}>{value}</Button>)}
    {first + pages.length - 1 < state.totalPages && <>{first + pages.length < state.totalPages && <span className="kk-pagination-gap" aria-hidden="true">…</span>}<Button onClick={() => go(state.totalPages)} aria-label={pageLabel(state.totalPages)}>{state.totalPages}</Button></>}
    <Button disabled={!state.hasNext} onClick={() => go(state.page + 1)} aria-label={ko ? '다음 페이지' : 'Next page'}>{ko ? '다음' : 'Next'}</Button>
  </div></nav>;
}
