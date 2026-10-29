import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const TONES = {
  info: { icon: Info, box: 'border-brand-200 bg-brand-50 text-brand-900', iconClass: 'text-brand-600' },
  success: { icon: CheckCircle2, box: 'border-emerald-200 bg-emerald-50 text-emerald-900', iconClass: 'text-emerald-600' },
  warning: { icon: AlertTriangle, box: 'border-amber-200 bg-amber-50 text-amber-900', iconClass: 'text-amber-600' },
  error: { icon: OctagonAlert, box: 'border-red-200 bg-red-50 text-red-900', iconClass: 'text-red-600' },
};

export default function Alert({ tone = 'info', title, children, action, className, role }) {
  const t = TONES[tone] || TONES.info;
  const Icon = t.icon;
  return (
    <div
      className={cn('flex gap-3 rounded-xl border p-4 text-sm', t.box, className)}
      role={role || (tone === 'error' ? 'alert' : 'status')}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', t.iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
