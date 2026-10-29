import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { RefreshCw, SearchX } from 'lucide-react';
import FacilityDetails from '../components/FacilityDetails.jsx';
import OsmAttribution from '../components/OsmAttribution.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, Container, EmptyState } from '../components/ui/Misc.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { hospitalService } from '../services/index.js';
import { categoryMeta, displayName } from '../utils/facility.js';

const VALID_TYPES = new Set(['node', 'way', 'relation']);

function pinIcon(category) {
  const meta = categoryMeta(category);
  return L.divIcon({
    className: 'mf-marker is-selected',
    html: `<div class="pin" style="background:${meta.color}"><span>${meta.letter}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

export default function FacilityPage() {
  const { osmType, osmId } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [attempt, setAttempt] = useState(0);

  const origin = useMemo(() => {
    const lat = Number(sp.get('lat'));
    const lon = Number(sp.get('lon'));
    return sp.get('lat') && Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  }, [sp]);

  const validId = VALID_TYPES.has(osmType) && /^\d+$/.test(osmId || '');

  useEffect(() => {
    if (!validId) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    hospitalService
      .get(osmType, osmId, origin, controller.signal)
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((error) => {
        if (!error.cancelled) setState({ loading: false, error, data: null });
      });
    return () => controller.abort();
  }, [osmType, osmId, origin, validId, attempt]);

  const facility = state.data?.facility;
  useDocumentTitle(facility ? displayName(facility) : 'Facility details');

  if (!validId) {
    return (
      <Container className="py-16">
        <EmptyState icon={SearchX} title="Invalid facility link" action={<Button to="/hospitals">Search facilities</Button>}>
          This link doesn't point to a valid OpenStreetMap facility.
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <Button variant="ghost" size="sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/hospitals'))} className="-ml-2 mb-4">
        ← Back
      </Button>

      {state.loading && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]" role="status" aria-label="Loading facility">
          <Card className="space-y-4 p-6">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </Card>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      )}

      {state.error && (
        <Alert
          tone="error"
          title={state.error.status === 404 ? 'Facility not found' : 'Could not load this facility'}
          action={
            <div className="flex flex-wrap gap-2">
              {state.error.status !== 404 && (
                <Button size="sm" icon={RefreshCw} onClick={() => setAttempt((n) => n + 1)}>
                  Try again
                </Button>
              )}
              <Button size="sm" variant="outline" to="/hospitals">
                Search facilities
              </Button>
            </div>
          }
        >
          {state.error.message}
        </Alert>
      )}

      {facility && !state.loading && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="p-5 sm:p-6">
            <FacilityDetails facility={facility} origin={origin} headingLevel={1} />
          </Card>
          <div className="space-y-2">
            <div className="h-80 overflow-hidden rounded-2xl border border-slate-200 shadow-card lg:sticky lg:top-24 lg:h-[28rem]" role="region" aria-label="Facility location map">
              <MapContainer center={[facility.lat, facility.lon]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                  url={import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  maxZoom={19}
                />
                <Marker position={[facility.lat, facility.lon]} icon={pinIcon(facility.category)} title={displayName(facility)} />
              </MapContainer>
            </div>
            <OsmAttribution source={state.data.source} />
          </div>
        </div>
      )}
    </Container>
  );
}
