import { Accessibility, ArrowLeft, Building, Clock, ExternalLink, Globe, Mail, MapPin, Navigation, Phone, Siren, Stethoscope } from 'lucide-react';
import CategoryIcon, { CategoryBadge } from './CategoryIcon.jsx';
import FavouriteButton from './FavouriteButton.jsx';
import Button from './ui/Button.jsx';
import { displayName, formatCoords, formatDistance, googleDirectionsUrl, osmDirectionsUrl, telHref } from '../utils/facility.js';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-slate-800">{children}</dd>
      </div>
    </div>
  );
}

const Unavailable = ({ children = 'Not listed in OpenStreetMap' }) => <span className="text-slate-400">{children}</span>;

const humanize = (value) => value?.replace(/_/g, ' ').replace(/;/g, ', ');

export default function FacilityDetails({ facility, origin, onBack, backLabel = 'Back to results', headingLevel = 2 }) {
  const name = displayName(facility);
  const Heading = `h${headingLevel}`;
  const distance = formatDistance(facility.distanceMeters);

  return (
    <div className="space-y-4">
      {onBack && (
        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={onBack} className="-ml-2">
          {backLabel}
        </Button>
      )}

      <div className="flex gap-3">
        <CategoryIcon category={facility.category} size="lg" />
        <div className="min-w-0 flex-1">
          <Heading className="text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
            <span className={facility.name ? '' : 'italic text-slate-600'}>{name}</span>
          </Heading>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={facility.category} label={facility.categoryLabel} />
            {distance && <span className="text-xs font-medium text-slate-600">{distance} from search location</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button
          href={googleDirectionsUrl(facility, origin)}
          target="_blank"
          rel="noopener noreferrer"
          icon={Navigation}
          aria-label={`Get directions to ${name} in Google Maps (opens in a new tab)`}
        >
          Directions
        </Button>
        {facility.phones?.length > 0 && telHref(facility.phones[0]) && (
          <Button href={telHref(facility.phones[0])} variant="outline" icon={Phone} aria-label={`Call ${name}`}>
            Call
          </Button>
        )}
        <FavouriteButton facility={facility} size="md" />
      </div>

      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-4">
        <Row icon={MapPin} label="Address">
          {facility.address || <Unavailable />}
        </Row>
        <Row icon={Phone} label="Phone">
          {facility.phones?.length ? (
            <ul className="space-y-0.5">
              {facility.phones.map((p) => (
                <li key={p}>
                  {telHref(p) ? (
                    <a href={telHref(p)} className="text-brand-700 underline-offset-2 hover:underline">
                      {p}
                    </a>
                  ) : (
                    p
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Unavailable />
          )}
        </Row>
        {facility.website && (
          <Row icon={Globe} label="Website">
            <a href={facility.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 break-all text-brand-700 hover:underline">
              {facility.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          </Row>
        )}
        {facility.email && (
          <Row icon={Mail} label="Email">
            {facility.email}
          </Row>
        )}
        {facility.openingHours && (
          <Row icon={Clock} label="Opening hours (as listed in OSM)">
            <span className="font-mono text-xs">{facility.openingHours}</span>
          </Row>
        )}
        {facility.emergency && (
          <Row icon={Siren} label="Emergency department (as listed in OSM)">
            {facility.emergency === 'yes' ? 'Listed as yes' : facility.emergency === 'no' ? 'Listed as no' : humanize(facility.emergency)}
          </Row>
        )}
        {facility.speciality && (
          <Row icon={Stethoscope} label="Speciality">
            <span className="capitalize">{humanize(facility.speciality)}</span>
          </Row>
        )}
        {(facility.operator || facility.operatorType) && (
          <Row icon={Building} label="Operator">
            {[facility.operator, facility.operatorType && `(${humanize(facility.operatorType)})`].filter(Boolean).join(' ')}
          </Row>
        )}
        {facility.wheelchair && (
          <Row icon={Accessibility} label="Wheelchair access (as listed in OSM)">
            <span className="capitalize">{humanize(facility.wheelchair)}</span>
          </Row>
        )}
        <Row icon={MapPin} label="Coordinates">
          <span className="font-mono text-xs">{formatCoords(facility.lat, facility.lon)}</span>
        </Row>
      </dl>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <a href={osmDirectionsUrl(facility, origin)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
          Directions in OpenStreetMap <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
        <a href={facility.osmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
          View source record ({facility.osmType}/{facility.osmId}) <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
        Details come directly from OpenStreetMap and may be incomplete or out of date. MedFinder Pro has not verified this
        facility, its services or availability. Please call ahead where possible. In an emergency, call{' '}
        <a href="tel:112" className="font-semibold text-red-700 underline">112</a>.
      </p>
    </div>
  );
}
