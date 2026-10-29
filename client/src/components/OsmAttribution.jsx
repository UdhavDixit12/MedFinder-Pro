import { Database } from 'lucide-react';
import { cn } from '../utils/cn.js';

export default function OsmAttribution({ source, className }) {
  const dataDate = source?.dataTimestamp ? new Date(source.dataTimestamp) : null;
  return (
    <p className={cn('flex items-start gap-1.5 text-xs leading-relaxed text-slate-500', className)}>
      <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Live data from{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-700">
          © OpenStreetMap contributors
        </a>{' '}
        (ODbL) via the Overpass API{source?.endpoint ? ` (${source.endpoint})` : ''}.
        {dataDate && !Number.isNaN(dataDate.getTime()) && <> Map data as of {dataDate.toLocaleDateString()}.</>} Listings are
        community-contributed and not verified by MedFinder Pro — please confirm details with the facility.
      </span>
    </p>
  );
}
