import React, { useEffect, useId, useRef } from 'react';
export function Button({ variant = 'default', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'quiet';
}) {
  return <button type="button" {...props} className={`kk-button kk-button--${variant} ${className}`} />;
}
export function Badge({ children, tone = 'neutral' }: {
  children: React.ReactNode;
  tone?: 'neutral' | 'positive' | 'warning' | 'negative';
}) {
  return <span className={`kk-badge kk-badge--${tone}`}>{children}</span>;
}
export function Field({ label, children, hint }: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return <label className="kk-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
export function Checkbox({ label, description, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string; description?: string }) {
  return <label className="kk-check"><input type="checkbox" {...props}/><span><strong>{label}</strong>{description && <small>{description}</small>}</span></label>;
}
export function Switch({ checked, onCheckedChange, label, description, disabled = false }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return <div className="kk-switch-row"><span><strong>{label}</strong>{description && <small>{description}</small>}</span><button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="kk-switch" onClick={() => onCheckedChange(!checked)}><span/></button></div>;
}
export function FilterChip({ pressed, children, ...props }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & { pressed: boolean; children: React.ReactNode }) {
  return <button type="button" aria-pressed={pressed} {...props} className={`kk-filter-chip ${props.className ?? ''}`}>{children}</button>;
}
export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (value: T) => void; items: readonly { value: T; label: string }[]; label: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  function move(from: number, event: React.KeyboardEvent<HTMLButtonElement>) {
    let next = from;
    if (event.key === 'ArrowRight') next = (from + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (from - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    const item = items[next];
    if (!item) return;
    refs.current[next]?.focus();
    onChange(item.value);
  }
  return <div className="kk-tabs" role="tablist" aria-label={label}>{items.map((item, index) => <button ref={node => { refs.current[index] = node; }} key={item.value} type="button" role="tab" aria-selected={value === item.value} tabIndex={value === item.value ? 0 : -1} onClick={() => onChange(item.value)} onKeyDown={event => move(index, event)}>{item.label}</button>)}</div>;
}
export function Tooltip({ label, children }: { label: string; children: React.ReactElement }) {
  const id = useId();
  return <span className="kk-tooltip-wrap">{React.cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': id })}<span id={id} role="tooltip" className="kk-tooltip">{label}</span></span>;
}
export function DateRangeField({ start, end, onChange, startLabel = 'Start', endLabel = 'End' }: { start: string; end: string; onChange: (range: { start: string; end: string }) => void; startLabel?: string; endLabel?: string }) {
  return <div className="kk-date-range"><label><span>{startLabel}</span><input type="date" value={start} max={end || undefined} onChange={event => onChange({ start: event.target.value, end })}/></label><span aria-hidden="true">→</span><label><span>{endLabel}</span><input type="date" value={end} min={start || undefined} onChange={event => onChange({ start, end: event.target.value })}/></label></div>;
}
export function StatePanel({ title, message, kind = 'empty', action }: {
  title: string;
  message: string;
  kind?: 'empty' | 'error' | 'loading' | 'partial' | 'stale';
  action?: React.ReactNode;
}) {
  return <div className={`kk-state kk-state--${kind}`} role={kind === 'error' ? 'alert' : 'status'} aria-busy={kind === 'loading'}><strong>{title}</strong><p>{message}</p>{action}</div>;
}
/** Native dialog handles modal focus containment; the caller controls open state. */
export function Dialog({ open, onClose, title, children, closeLabel = 'Close' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const node = ref.current;
    if (open && node && !node.open) node.showModal();
    if (!open && node?.open) node.close();
  }, [open]);
  return <dialog className="kk-dialog" ref={ref} aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }}><div className="kk-dialog-heading"><h2 id={id}>{title}</h2><Button variant="quiet" onClick={onClose}>{closeLabel}</Button></div>{children}</dialog>;
}
