import { forwardRef } from 'react';
import { MapPin, Navigation, Phone } from 'lucide-react';
import CategoryIcon, { CategoryBadge } from './CategoryIcon.jsx';
import FavouriteButton from './FavouriteButton.jsx';
import Button from './ui/Button.jsx';
import { displayName, formatDistance, googleDirectionsUrl, telHref } from '../utils/facility.js';
import { cn } from '../utils/cn.js';

const FacilityCard = forwardRef(function FacilityCard({ facility, origin, selected = false, onSelect, index }, ref) {
  const name = displayName(facility);
  const distance = formatDistance(facility.distanceMeters);
  const phone = facility.phones?.[0];
  const phoneHref = telHref(phone);

  return (
    <article
      ref={ref}
      className={cn(
        'group relative rounded-xl border bg-white p-4 shadow-card transition-[border-color,box-shadow]',
        selected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200 hover:border-slate-300 hover:shadow-raised',
      )}
      aria-current={selected || undefined}
    >
      <div className="flex gap-3">
        <CategoryIcon category={facility.category} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-[15px] font-semibold leading-snug text-slate-900">
              <button
                type="button"
                onClick={() => onSelect?.(facility.id)}
                className="text-left after:absolute after:inset-0 after:rounded-xl after:content-[''] hover:text-brand-700 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand-600"
              >
                {index != null && <span className="sr-only">Result {index + 1}: </span>}
                <span className={cn(!facility.name && 'italic text-slate-600')}>{name}</span>
              </button>
            </h3>
            {distance && (
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">{distance}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={facility.category} label={facility.categoryLabel} />
            {facility.emergency === 'yes' && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                Emergency listed
              </span>
            )}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {facility.address ? (
              <span className="line-clamp-2">{facility.address}</span>
            ) : (
              <span className="text-slate-400">Address not listed in OpenStreetMap</span>
            )}
          </p>
          {phone && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">{phone}</span>
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <Button
          href={googleDirectionsUrl(facility, origin)}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          variant="subtle"
          icon={Navigation}
          aria-label={`Directions to ${name} (opens Google Maps)`}
        >
          Directions
        </Button>
        {phoneHref && (
          <Button href={phoneHref} size="sm" variant="outline" icon={Phone} aria-label={`Call ${name}`}>
            Call
          </Button>
        )}
        <FavouriteButton facility={facility} className="ml-auto" />
      </div>
    </article>
  );
});

export default FacilityCard;
