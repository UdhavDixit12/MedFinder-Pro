import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List, Map as MapIcon, RefreshCw, SearchX, Loader2 } from 'lucide-react';
import LocationSearchBar from '../components/LocationSearchBar.jsx';
import FacilityCard from '../components/FacilityCard.jsx';
import FacilityMap from '../components/FacilityMap.jsx';
import FacilityDetails from '../components/FacilityDetails.jsx';
import OsmAttribution from '../components/OsmAttribution.jsx';
import CategoryIcon from '../components/CategoryIcon.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import { Container, EmptyState } from '../components/ui/Misc.jsx';
import { SkeletonList } from '../components/ui/Skeleton.jsx';
import useHospitalSearch, { searchKey } from '../hooks/useHospitalSearch.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useMediaQuery from '../hooks/useMediaQuery.js';
import {
  DEFAULT_LOCATION,
  DEFAULT_RADIUS,
  RADIUS_OPTIONS,
  TYPE_FILTERS,
  displayName,
  formatDistance,
  formatRadius,
} from '../utils/facility.js';
import { cn } from '../utils/cn.js';

const VALID_TYPES = new Set(TYPE_FILTERS.map((t) => t.key));

function readParams(sp) {
  const lat = sp.get('lat') !== null ? Number(sp.get('lat')) : null;
  const lon = sp.get('lon') !== null ? Number(sp.get('lon')) : null;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  const radius = Number(sp.get('radius'));
  const type = sp.get('type');
  return {
    location: hasCoords ? null : sp.get('location')?.trim() || DEFAULT_LOCATION,
    lat: hasCoords ? lat : null,
    lon: hasCoords ? lon : null,
    radius: RADIUS_OPTIONS.includes(radius) ? radius : DEFAULT_RADIUS,
    type: VALID_TYPES.has(type) ? type : 'all',
  };
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => readParams(searchParams), [searchParams]);
  const { loading, slow, error, result, resultAt, isStale, retry } = useHospitalSearch(params);

  const [sort, setSort] = useState('distance');
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scrollToId, setScrollToId] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const cardRefs = useRef({});
  const listTopRef = useRef(null);

  useDocumentTitle(result?.location?.label ? `Healthcare near ${result.location.label.split(',')[0]}` : 'Find healthcare');

  const updateParams = useCallback(
    (changes) => {
      const next = { ...params, ...changes };
      const sp = new URLSearchParams();
      if (next.lat != null && next.lon != null) {
        sp.set('lat', String(next.lat));
        sp.set('lon', String(next.lon));
      } else {
        sp.set('location', next.location || DEFAULT_LOCATION);
      }
      sp.set('radius', String(next.radius));
      sp.set('type', next.type);
      setSearchParams(sp);
    },
    [params, setSearchParams],
  );

  const facilities = useMemo(() => {
    let list = result?.facilities || [];
    if (onlyWithPhone) list = list.filter((f) => f.phones?.length);
    if (sort === 'name') {
      list = [...list].sort((a, b) => displayName(a).localeCompare(displayName(b)));
    }
    return list;
  }, [result, sort, onlyWithPhone]);

  const resultParamsKey = result ? `${result.location.lat},${result.location.lon}|${result.query.radius}|${result.query.type}` : null;

  // Reset selection whenever a different result set is displayed.
  useEffect(() => {
    setSelectedId(null);
    setDetailsOpen(false);
  }, [resultParamsKey]);

  const selected = facilities.find((f) => f.id === selectedId) || null;
  const origin = result ? { lat: result.location.lat, lon: result.location.lon } : null;

  const selectFromList = (id) => {
    setSelectedId(id);
    setDetailsOpen(true);
    listTopRef.current?.scrollIntoView({ block: 'nearest' });
  };

  const selectFromMap = (id) => {
    setSelectedId(id);
    if (isDesktop) {
      setDetailsOpen(false);
      setScrollToId(id);
    }
  };

  // Runs after render: if the details panel was open, the cards only exist once it has closed.
  useEffect(() => {
    if (!scrollToId || detailsOpen) return;
    cardRefs.current[scrollToId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setScrollToId(null);
  }, [scrollToId, detailsOpen]);

  const openDetails = (id) => {
    setSelectedId(id);
    setDetailsOpen(true);
    if (!isDesktop) setMobileView('list');
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    const id = selectedId;
    requestAnimationFrame(() => cardRefs.current[id]?.scrollIntoView({ block: 'center' }));
  };

  const resultType = result?.query.type || params.type;
  const typeLabel = TYPE_FILTERS.find((t) => t.key === resultType)?.label || 'facilities';
  const showInitialLoading = loading && !result;
  const showBlockingError = error && !result;
  const resultLocation = result?.location;

  return (
    <div className="bg-slate-50">
      {/* Search header */}
      <div className="border-b border-slate-200 bg-white">
        <Container className="space-y-4 py-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Find healthcare near you</h1>
              <p className="mt-1 text-sm text-slate-600">Live hospital, clinic and pharmacy listings from OpenStreetMap.</p>
            </div>
          </div>

          <LocationSearchBar
            initialValue={params.location || ''}
            busy={loading}
            onSearch={(location) => updateParams({ location, lat: null, lon: null })}
            onUseLocation={({ lat, lon }) => updateParams({ lat, lon, location: null })}
          />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 scrollbar-thin" role="group" aria-label="Facility type">
              <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap sm:pb-0">
                {TYPE_FILTERS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => updateParams({ type: t.key })}
                    aria-pressed={params.type === t.key}
                    className={cn(
                      'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors',
                      params.type === t.key
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <span className="font-medium">Radius</span>
                <select
                  value={params.radius}
                  onChange={(e) => updateParams({ radius: Number(e.target.value) })}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/20"
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {formatRadius(r)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <span className="font-medium">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/20"
                >
                  <option value="distance">Nearest first</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyWithPhone}
                  onChange={(e) => setOnlyWithPhone(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Has phone number
              </label>
            </div>
          </div>
        </Container>
      </div>

      <Container className="space-y-4 py-4">
        {/* Status line */}
        <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
          <div className="min-w-0 text-sm text-slate-700">
            {showInitialLoading && (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" />
                Searching OpenStreetMap near {params.location || 'your location'}…
              </span>
            )}
            {loading && slow && (
              <span className="mt-1 block text-xs text-slate-500">
                This is taking longer than usual — public OpenStreetMap servers are busy. We'll try backup servers automatically.
              </span>
            )}
            {result && (
              <p>
                <span className="font-semibold text-slate-900">{facilities.length}</span>{' '}
                {resultType === 'all' ? 'healthcare facilities' : typeLabel.toLowerCase()} within{' '}
                {formatRadius(result.query.radius)} of <span className="font-medium text-slate-900">{resultLocation.label}</span>
                {loading && (
                  <span className="ml-2 inline-flex items-center gap-1 text-brand-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Updating…
                  </span>
                )}
              </p>
            )}
          </div>
          {result && (
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 lg:hidden" role="group" aria-label="Choose view">
              {[
                { key: 'list', label: 'List', icon: List },
                { key: 'map', label: 'Map', icon: MapIcon },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMobileView(key)}
                  aria-pressed={mobileView === key}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium',
                    mobileView === key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {result?.truncated && (
          <Alert tone="info">
            Showing the nearest {result.facilities.length} of {result.total} matching facilities. Reduce the radius or choose a
            category to narrow the results.
          </Alert>
        )}

        {isStale && error && (
          <Alert
            tone="warning"
            title="The latest search could not be completed"
            action={
              <Button size="sm" variant="outline" icon={RefreshCw} onClick={retry}>
                Try again
              </Button>
            }
          >
            {error.message} The results below are from your previous search
            {resultLocation ? ` near ${resultLocation.label}` : ''}
            {resultAt ? `, loaded at ${new Date(resultAt).toLocaleTimeString()}` : ''}, and may not match your current filters.
          </Alert>
        )}

        {showBlockingError && (
          <Alert
            tone="error"
            title="We couldn't load healthcare facilities"
            action={
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={RefreshCw} onClick={retry}>
                  Try again
                </Button>
                {params.radius > 5000 && (
                  <Button size="sm" variant="outline" onClick={() => updateParams({ radius: 5000 })}>
                    Use a 5 km radius
                  </Button>
                )}
              </div>
            }
          >
            {error.message}
            {error.code?.startsWith('UPSTREAM') &&
              ' OpenStreetMap services are free public infrastructure and are sometimes busy. No sample data is shown in place of real results.'}
          </Alert>
        )}

        {showInitialLoading && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_1fr]">
            <SkeletonList count={5} />
            <div className="hidden h-[calc(100vh-16rem)] min-h-96 animate-pulse rounded-2xl bg-slate-200/70 lg:block" aria-hidden="true" />
          </div>
        )}

        {result && (
          <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,26rem)_1fr]', isStale && 'opacity-80')}>
            {/* List / details column */}
            <section
              aria-label="Search results"
              className={cn(
                'min-w-0 lg:h-[calc(100vh-15rem)] lg:min-h-[28rem] lg:overflow-y-auto lg:pr-1 scrollbar-thin',
                mobileView === 'map' && 'hidden lg:block',
              )}
            >
              <div ref={listTopRef} className="scroll-mt-20" />
              {detailsOpen && selected ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
                  <FacilityDetails facility={selected} origin={origin} onBack={closeDetails} />
                </div>
              ) : null}

              <div className={cn(detailsOpen && selected && 'hidden')}>
                {facilities.length === 0 ? (
                  <EmptyState
                    icon={SearchX}
                    title={onlyWithPhone && result.facilities.length ? 'No results with a listed phone number' : 'No facilities found'}
                    action={
                      <>
                        {onlyWithPhone && result.facilities.length > 0 && (
                          <Button size="sm" variant="outline" onClick={() => setOnlyWithPhone(false)}>
                            Show all results
                          </Button>
                        )}
                        {params.radius < 25000 && (
                          <Button
                            size="sm"
                            onClick={() => updateParams({ radius: RADIUS_OPTIONS.find((r) => r > params.radius) || 25000 })}
                          >
                            Search a wider area
                          </Button>
                        )}
                        {params.type !== 'all' && (
                          <Button size="sm" variant="outline" onClick={() => updateParams({ type: 'all' })}>
                            Include all types
                          </Button>
                        )}
                      </>
                    }
                  >
                    OpenStreetMap has no {resultType === 'all' ? 'healthcare facilities' : typeLabel.toLowerCase()} recorded within{' '}
                    {formatRadius(result.query.radius)} of this location. Map coverage varies by area, so this doesn't mean none
                    exist.
                  </EmptyState>
                ) : (
                  <ol className="space-y-3">
                    {facilities.map((f, i) => (
                      <li key={f.id}>
                        <FacilityCard
                          ref={(el) => {
                            if (el) cardRefs.current[f.id] = el;
                            else delete cardRefs.current[f.id];
                          }}
                          facility={f}
                          origin={origin}
                          index={i}
                          selected={f.id === selectedId}
                          onSelect={selectFromList}
                        />
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>

            {/* Map column */}
            <section className={cn('min-w-0 space-y-2', mobileView === 'list' && 'hidden lg:block')} aria-label="Map">
              <div className="relative">
                <FacilityMap
                  className="h-[65vh] min-h-80 overflow-hidden rounded-2xl border border-slate-200 shadow-card lg:h-[calc(100vh-17rem)] lg:min-h-[26rem]"
                  facilities={facilities}
                  selectedId={selectedId}
                  onSelect={selectFromMap}
                  onOpenDetails={openDetails}
                  origin={origin}
                  radius={result.query.radius}
                  viewKey={searchKey({ ...result.query, lat: origin.lat, lon: origin.lon })}
                  visible={isDesktop || mobileView === 'map'}
                />
                {!isDesktop && selected && mobileView === 'map' && (
                  <div className="absolute inset-x-2 bottom-2 z-[500] flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-raised">
                    <CategoryIcon category={selected.category} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName(selected)}</p>
                      <p className="text-xs text-slate-600">
                        {selected.categoryLabel}
                        {selected.distanceMeters != null && ` · ${formatDistance(selected.distanceMeters)}`}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openDetails(selected.id)}>
                      Details
                    </Button>
                  </div>
                )}
              </div>
              <OsmAttribution source={result.source} />
            </section>
          </div>
        )}
      </Container>
    </div>
  );
}
