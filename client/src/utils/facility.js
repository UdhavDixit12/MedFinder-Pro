import { Building2, Stethoscope, Pill, FlaskConical, Smile, UserRound, HeartPulse } from 'lucide-react';

export const DEFAULT_LOCATION = 'Bhiwani, Haryana, India';
export const DEFAULT_RADIUS = 5000;
export const RADIUS_OPTIONS = [1000, 2000, 5000, 10000, 15000, 25000];

export const CATEGORY_META = {
  hospital: { label: 'Hospital', plural: 'Hospitals', color: '#dc2626', letter: 'H', icon: Building2, badge: 'bg-red-50 text-red-700 ring-red-200' },
  clinic: { label: 'Clinic', plural: 'Clinics', color: '#0d9488', letter: 'C', icon: Stethoscope, badge: 'bg-teal-50 text-teal-700 ring-teal-200' },
  doctors: { label: "Doctor's office", plural: 'Doctors', color: '#2554eb', letter: 'D', icon: UserRound, badge: 'bg-brand-50 text-brand-700 ring-brand-200' },
  dentist: { label: 'Dentist', plural: 'Dentists', color: '#7c3aed', letter: 'T', icon: Smile, badge: 'bg-violet-50 text-violet-700 ring-violet-200' },
  pharmacy: { label: 'Pharmacy', plural: 'Pharmacies', color: '#059669', letter: 'P', icon: Pill, badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  laboratory: { label: 'Laboratory', plural: 'Laboratories', color: '#c2410c', letter: 'L', icon: FlaskConical, badge: 'bg-orange-50 text-orange-700 ring-orange-200' },
  other: { label: 'Healthcare facility', plural: 'Other', color: '#475569', letter: '+', icon: HeartPulse, badge: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hospital', label: 'Hospitals' },
  { key: 'clinic', label: 'Clinics' },
  { key: 'doctors', label: 'Doctors' },
  { key: 'pharmacy', label: 'Pharmacies' },
  { key: 'dentist', label: 'Dentists' },
  { key: 'laboratory', label: 'Labs' },
];

export const categoryMeta = (key) => CATEGORY_META[key] || CATEGORY_META.other;

export const displayName = (facility) => facility?.name || `Unnamed ${categoryMeta(facility?.category).label.toLowerCase()}`;

export function formatDistance(meters) {
  if (meters == null || !Number.isFinite(meters)) return null;
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export const formatRadius = (meters) => (meters >= 1000 ? `${meters / 1000} km` : `${meters} m`);

export const formatCoords = (lat, lon) => `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

/** Google Maps directions using the facility's real source coordinates. */
export function googleDirectionsUrl(facility, origin) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${facility.lat},${facility.lon}`);
  if (origin) url.searchParams.set('origin', `${origin.lat},${origin.lon}`);
  return url.toString();
}

export function osmDirectionsUrl(facility, origin) {
  const from = origin ? `${origin.lat},${origin.lon}` : '';
  return `https://www.openstreetmap.org/directions?route=${encodeURIComponent(`${from};${facility.lat},${facility.lon}`)}#map=16/${facility.lat}/${facility.lon}`;
}

/** Sanitise a phone string from OSM into a tel: link. Returns null when unusable. */
export function telHref(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.replace(/\D/g, '').length >= 3 ? `tel:${cleaned}` : null;
}

export const facilityPath = (facility) => `/hospitals/${facility.osmType}/${facility.osmId}`;
