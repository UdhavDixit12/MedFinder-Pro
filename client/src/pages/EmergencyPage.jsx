import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation, Phone, RefreshCw } from 'lucide-react';
import EmergencyPanel from '../components/EmergencyPanel.jsx';
import CategoryIcon from '../components/CategoryIcon.jsx';
import OsmAttribution from '../components/OsmAttribution.jsx';
import LocationSearchBar from '../components/LocationSearchBar.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, Container, EmptyState } from '../components/ui/Misc.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';
import useHospitalSearch from '../hooks/useHospitalSearch.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { DEFAULT_LOCATION, displayName, formatDistance, googleDirectionsUrl, telHref } from '../utils/facility.js';

const TELL_DISPATCHER = [
  'Your exact location or a nearby landmark',
  'What happened and when',
  'How many people need help',
  'Whether the person is conscious and breathing',
  'A phone number where you can be reached',
];

export default function EmergencyPage() {
  useDocumentTitle('Emergency assistance');
  const [params, setParams] = useState({ location: DEFAULT_LOCATION, lat: null, lon: null, radius: 10000, type: 'hospital' });
  const search = useHospitalSearch(params, { debounceMs: 0 });
  const nearest = search.result?.facilities.slice(0, 5) || [];
  const origin = search.result ? { lat: search.result.location.lat, lon: search.result.location.lon } : null;

  return (
    <Container className="py-8 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Emergency assistance</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Quick access to Indian emergency numbers and the nearest hospitals listed in OpenStreetMap.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <EmergencyPanel
          onFindNearby={(coords) => {
            if (coords) setParams((p) => ({ ...p, lat: coords.lat, lon: coords.lon, location: null }));
            document.getElementById('nearest-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold text-slate-900">When you call, tell them</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {TELL_DISPATCHER.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Follow the instructions given by the emergency operator. Stay on the line until they tell you to hang up.
          </p>
        </Card>
      </div>

      <section className="mt-10" aria-labelledby="nearest-heading">
        <h2 id="nearest-heading" className="scroll-mt-24 text-lg font-semibold text-slate-900">
          Nearest hospitals {search.result && <span className="font-normal text-slate-500">near {search.result.location.label.split(',').slice(0, 2).join(',')}</span>}
        </h2>
        <LocationSearchBar
          className="mt-3 max-w-2xl"
          initialValue={params.location || ''}
          busy={search.loading}
          onSearch={(location) => setParams((p) => ({ ...p, location, lat: null, lon: null }))}
          onUseLocation={({ lat, lon }) => setParams((p) => ({ ...p, lat, lon, location: null }))}
        />
        <Alert tone="warning" className="mt-4">
          A listing here does not confirm that a hospital has an emergency department or is open right now. If possible, call
          ahead or call 112 for guidance on where to go.
        </Alert>

        <div className="mt-4">
          {search.loading && !search.result && <SkeletonList count={3} />}
          {search.error && (
            <Alert
              tone="error"
              title="Couldn't load nearby hospitals"
              action={
                <Button size="sm" variant="outline" icon={RefreshCw} onClick={search.retry}>
                  Try again
                </Button>
              }
            >
              {search.error.message} Please call 112 if you need urgent help.
            </Alert>
          )}
          {search.result && nearest.length === 0 && (
            <EmptyState title="No hospitals recorded within 10 km">
              OpenStreetMap has no hospitals listed within 10 km of this location. Call 112 for guidance.
            </EmptyState>
          )}
          {nearest.length > 0 && (
            <>
              <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {nearest.map((f) => {
                  const phone = telHref(f.phones?.[0]);
                  return (
                    <li key={f.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                      <div className="flex gap-3">
                        <CategoryIcon category={f.category} />
                        <div className="min-w-0 flex-1">
                          <Link to={`/hospitals/${f.osmType}/${f.osmId}?lat=${origin.lat}&lon=${origin.lon}`} className="font-semibold text-slate-900 hover:text-brand-700">
                            {displayName(f)}
                          </Link>
                          <p className="text-sm text-slate-600">
                            {formatDistance(f.distanceMeters)} away
                            {f.emergency === 'yes' && <span className="ml-2 font-medium text-red-700">· Emergency listed in OSM</span>}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{f.address || 'Address not listed'}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                        <Button href={googleDirectionsUrl(f, origin)} target="_blank" rel="noopener noreferrer" size="sm" icon={Navigation}>
                          Directions
                        </Button>
                        {phone && (
                          <Button href={phone} size="sm" variant="outline" icon={Phone}>
                            Call hospital
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              <OsmAttribution source={search.result.source} className="mt-3" />
            </>
          )}
        </div>
      </section>
    </Container>
  );
}
