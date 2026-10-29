import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn.js';

const controlBase =
  'block w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors ' +
  'focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/20 disabled:bg-slate-100 disabled:text-slate-500';

export const inputClass = (error) => cn(controlBase, 'h-10', error ? 'border-red-400' : 'border-slate-300');

export function Field({ label, hint, error, required, children, id, className }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      {children({ id: fieldId, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, hint, error, required, className, id, ...props }, ref) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {(a11y) => <input ref={ref} className={inputClass(error)} {...a11y} {...props} />}
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, hint, error, required, className, id, children, ...props }, ref) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {(a11y) => (
        <select ref={ref} className={cn(inputClass(error), 'pr-8')} {...a11y} {...props}>
          {children}
        </select>
      )}
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, hint, error, required, className, id, ...props }, ref) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={className}>
      {(a11y) => (
        <textarea
          ref={ref}
          className={cn(controlBase, 'min-h-28 py-2', error ? 'border-red-400' : 'border-slate-300')}
          {...a11y}
          {...props}
        />
      )}
    </Field>
  );
});
