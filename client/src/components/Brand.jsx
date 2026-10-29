import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function Brand({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 rounded-lg ${className}`} aria-label="MedFinder Pro home">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
        <Plus className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        MedFinder<span className="text-teal-600"> Pro</span>
      </span>
    </Link>
  );
}
