import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Database,
  FlaskConical,
  Heart,
  MapPinned,
  Navigation,
  Pill,
  RefreshCw,
  Search,
  ShieldCheck,
  Smile,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import LocationSearchBar from '../components/LocationSearchBar.jsx';
import FacilityCard from '../components/FacilityCard.jsx';
import EmergencyPanel from '../components/EmergencyPanel.jsx';
import OsmAttribution from '../components/OsmAttribution.jsx';
import Button from '../components/ui/Button.jsx';
import Alert from '../components/ui/Alert.jsx';
import { Card, Container, EmptyState, SectionHeading } from '../components/ui/Misc.jsx';
import { FacilityCardSkeleton } from '../components/ui/Skeleton.jsx';
import useHospitalSearch from '../hooks/useHospitalSearch.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { DEFAULT_LOCATION } from '../utils/facility.js';

const PREVIEW_PARAMS = { location: DEFAULT_LOCATION, radius: 5000, type: 'hospital' };

const CATEGORIES = [
  { type: 'hospital', label: 'Hospitals', description: 'General and specialty hospitals', icon: Building2, tone: 'bg-red-50 text-red-700' },
  { type: 'clinic', label: 'Clinics', description: 'Clinics and health centres', icon: Stethoscope, tone: 'bg-teal-50 text-teal-700' },
  { type: 'doctors', label: 'Doctors', description: "Doctors' offices and practices", icon: UserRound, tone: 'bg-brand-50 text-brand-700' },
  { type: 'pharmacy', label: 'Pharmacies', description: 'Chemists and pharmacies', icon: Pill, tone: 'bg-emerald-50 text-emerald-700' },
  { type: 'dentist', label: 'Dentists', description: 'Dental clinics', icon: Smile, tone: 'bg-violet-50 text-violet-700' },
  { type: 'laboratory', label: 'Laboratories', description: 'Diagnostic labs & blood banks', icon: FlaskConical, tone: 'bg-orange-50 text-orange-700' },
];

const STEPS = [
  { icon: Search, title: 'Search a location', text: 'Type a city, town or address — or choose to share your current location.' },
  { icon: MapPinned, title: 'Compare nearby options', text: 'See live OpenStreetMap listings on a list and map, sorted by distance.' },
  { icon: Navigation, title: 'Get there', text: 'Open turn-by-turn directions, call the facility where a number is listed, or save it.' },
];

export default function HomePage() {
  useDocumentTitle(null);
  const navigate = useNavigate();
  const preview = useHospitalSearch(PREVIEW_PARAMS, { debounceMs: 0 });
  const previewItems = preview.result?.facilities.slice(0, 6) || [];
  const origin = preview.result ? { lat: preview.result.location.lat, lon: preview.result.location.lon } : null;

  const goSearch = (location) => navigate(`/hospitals?location=${encodeURIComponent(location)}&radius=5000&type=all`);
  const goCoords = ({ lat, lon }) => navigate(`/hospitals?lat=${lat}&lon=${lon}&radius=5000&type=all`);

  return (
    <>
      {/* Hero */}
      <section className="relative border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-50),transparent_60%)]" aria-hidden="true" />
        <Container className="relative py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
              <Database className="h-3.5 w-3.5" aria-hidden="true" /> Live OpenStreetMap healthcare data
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Find hospitals, clinics and pharmacies near you
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Search any city or address in India — starting with Bhiwani, Haryana — and get real facility locations, contact
              details where available, and directions.
            </p>
          </div>
          <LocationSearchBar className="mt-8 max-w-3xl" size="lg" initialValue={DEFAULT_LOCATION} onSearch={goSearch} onUseLocation={goCoords} />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden="true" /> No location access unless you ask
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-teal-600" aria-hidden="true" /> Free account to save favourites
            </span>
          </div>
        </Container>
      </section>

      {/* Nearby preview */}
      <section className="py-14 sm:py-16" aria-labelledby="nearby-heading">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Near Bhiwani, Haryana</p>
              <h2 id="nearby-heading" className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Nearby hospitals
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                The closest hospitals within 5 km, loaded live from OpenStreetMap.
              </p>
            </div>
            <Button to="/hospitals?type=hospital&radius=5000" variant="outline" icon={ArrowRight}>
              View all on map
            </Button>
          </div>

          <div className="mt-6">
            {preview.loading && !preview.result && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading nearby hospitals">
                {Array.from({ length: 6 }, (_, i) => (
                  <FacilityCardSkeleton key={i} />
                ))}
              </div>
            )}
            {preview.error && !preview.result && (
              <Alert
                tone="error"
                title="Nearby hospitals couldn't be loaded right now"
                action={
                  <Button size="sm" variant="outline" icon={RefreshCw} onClick={preview.retry}>
                    Try again
                  </Button>
                }
              >
                {preview.error.message} You can still search from the box above.
              </Alert>
            )}
            {preview.result && previewItems.length === 0 && (
              <EmptyState icon={Building2} title="No hospitals recorded nearby">
                OpenStreetMap has no hospitals recorded within 5 km of Bhiwani. Try a wider search.
              </EmptyState>
            )}
            {previewItems.length > 0 && (
              <>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {previewItems.map((f) => (
                    <li key={f.id}>
                      <FacilityCard facility={f} origin={origin} onSelect={() => navigate(`/hospitals/${f.osmType}/${f.osmId}?lat=${origin.lat}&lon=${origin.lon}`)} />
                    </li>
                  ))}
                </ul>
                <OsmAttribution source={preview.result.source} className="mt-4" />
              </>
            )}
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className="border-y border-slate-200 bg-white py-14 sm:py-16" aria-labelledby="categories-heading">
        <Container>
          <SectionHeading id="categories-heading" eyebrow="Browse by type" title="What kind of care do you need?" />
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map(({ type, label, description, icon: Icon, tone }) => (
              <li key={type}>
                <Link
                  to={`/hospitals?type=${type}&radius=10000`}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tone}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{label}</span>
                    <span className="block text-sm text-slate-600">{description}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-16" aria-labelledby="how-heading">
        <Container>
          <SectionHeading id="how-heading" eyebrow="How it works" title="From search to directions in three steps" align="center" />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <Card className="h-full p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-slate-400">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Emergency + symptom checker */}
      <section className="border-t border-slate-200 bg-white py-14 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHeading eyebrow="Emergency assistance" title="Need urgent help?" className="mb-6" />
            <EmergencyPanel compact />
          </div>
          <div>
            <SectionHeading eyebrow="Symptom checker" title="Understand your symptoms" className="mb-6" />
            <Card className="flex h-fit flex-col p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Select common symptoms or describe how you feel to get general health information, warning signs to watch for,
                and guidance on when to see a doctor.
              </p>
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                Informational only — it does not diagnose conditions or recommend medicines.
              </p>
              <Button to="/symptoms" variant="secondary" className="mt-5" icon={ArrowRight}>
                Open symptom checker
              </Button>
            </Card>
          </div>
        </Container>
      </section>

      {/* About */}
      <section className="py-14 sm:py-16" aria-labelledby="about-heading">
        <Container className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            id="about-heading"
            eyebrow="About MedFinder Pro"
            title="Open data, honest results"
            description="MedFinder Pro searches OpenStreetMap — a free map built by a global community — in real time. We never invent listings, ratings or phone numbers. If something isn't recorded, we tell you."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ['Real listings', 'Every result links to its source record on OpenStreetMap.'],
              ['Clear gaps', "Missing addresses or phone numbers are marked as 'not listed'."],
              ['Private by default', 'Location is only used when you press "Use my location".'],
              ['Improve the map', 'Spotted an error? Anyone can fix it on OpenStreetMap.'],
            ].map(([title, text]) => (
              <li key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </li>
            ))}
          </ul>
        </Container>
        <Container className="mt-8">
          <Link to="/about" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Read about our data sources and limitations <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Container>
      </section>
    </>
  );
}
