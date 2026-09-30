import React, { forwardRef, useId } from 'react';
import { Button, Dialog, Field } from './primitives.js';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Label, hint and validation error remain programmatically associated. */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, hint, error, id, className = '', 'aria-describedby': describedBy, ...props }, ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const description = [describedBy, hint ? `${fieldId}-hint` : '', error ? `${fieldId}-error` : ''].filter(Boolean).join(' ') || undefined;
  return <div className="kk-input-field" data-invalid={!!error}>
    <Field label={label}>
      <input {...props} ref={ref} id={fieldId} aria-label={props['aria-label'] ?? label} className={className} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={description} aria-errormessage={error ? `${fieldId}-error` : undefined}/>
      {hint && <small id={`${fieldId}-hint`}>{hint}</small>}
      {error && <small className="kk-field-error" id={`${fieldId}-error`}>{error}</small>}
    </Field>
  </div>;
});

export interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  hint?: string;
  error?: string;
}

/** Native select retains platform keyboard and mobile picker behavior. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, options, hint, error, id, 'aria-describedby': describedBy, ...props }, ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const description = [describedBy, hint ? `${fieldId}-hint` : '', error ? `${fieldId}-error` : ''].filter(Boolean).join(' ') || undefined;
  return <div className="kk-input-field" data-invalid={!!error}>
    <Field label={label}>
      <select {...props} ref={ref} id={fieldId} aria-label={props['aria-label'] ?? label} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={description} aria-errormessage={error ? `${fieldId}-error` : undefined}>
        {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
      {hint && <small id={`${fieldId}-hint`}>{hint}</small>}
      {error && <small className="kk-field-error" id={`${fieldId}-error`}>{error}</small>}
    </Field>
  </div>;
});

export function ConfirmDialog({ open, title, message, onCancel, onConfirm, cancelLabel = 'Cancel', confirmLabel = 'Confirm', closeLabel = 'Close' }: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  closeLabel?: string;
}) {
  return <Dialog open={open} onClose={onCancel} title={title} closeLabel={closeLabel}>
    <p className="kk-confirm-message">{message}</p>
    <div className="kk-control-actions">
      <Button autoFocus onClick={onCancel}>{cancelLabel}</Button>
      <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Dialog>;
}

export function Notification({ title, message, tone = 'info', onDismiss, dismissLabel = 'Dismiss notification' }: {
  title: string;
  message: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  return <div className={`kk-notification kk-notification--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-atomic="true">
    <span className="kk-notification-marker" aria-hidden="true">{tone === 'success' ? '✓' : tone === 'error' || tone === 'warning' ? '!' : 'i'}</span>
    <div className="kk-notification-copy"><strong>{title}</strong><p>{message}</p></div>
    {onDismiss && <Button variant="quiet" className="kk-notification-dismiss" onClick={onDismiss} aria-label={dismissLabel}><span aria-hidden="true">×</span></Button>}
  </div>;
}
