import { categoryMeta } from '../utils/facility.js';
import { cn } from '../utils/cn.js';

export default function CategoryIcon({ category, className, size = 'md' }) {
  const meta = categoryMeta(category);
  const Icon = meta.icon;
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-lg text-white', size === 'lg' ? 'h-12 w-12' : 'h-10 w-10', className)}
      style={{ backgroundColor: meta.color }}
      aria-hidden="true"
    >
      <Icon className={size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
    </span>
  );
}

export function CategoryBadge({ category, label }) {
  const meta = categoryMeta(category);
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', meta.badge)}>
      {label || meta.label}
    </span>
  );
}
