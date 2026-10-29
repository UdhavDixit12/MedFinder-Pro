import { cn } from '../../utils/cn.js';

export function Card({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={cn('rounded-2xl border border-slate-200 bg-white shadow-card', className)} {...props}>
      {children}
    </Tag>
  );
}

export function Badge({ className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', className)}>
      {children}
    </span>
  );
}

export function Container({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn('flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center', className)}>
      {Icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {children && <div className="mt-1 max-w-md text-sm text-slate-600">{children}</div>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, className, align = 'left', id }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{eyebrow}</p>}
      <h2 id={id} className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>}
    </div>
  );
}
