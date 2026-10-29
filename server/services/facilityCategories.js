/**
 * Healthcare facility categories and the OpenStreetMap tag filters that
 * define them. See https://wiki.openstreetmap.org/wiki/Key:healthcare
 */
export const CATEGORIES = {
  hospital: {
    label: 'Hospital',
    filters: [['amenity', 'hospital'], ['healthcare', 'hospital']],
  },
  clinic: {
    label: 'Clinic',
    filters: [['amenity', 'clinic'], ['healthcare', 'clinic'], ['healthcare', 'centre']],
  },
  doctors: {
    label: "Doctor's office",
    filters: [['amenity', 'doctors'], ['healthcare', 'doctor']],
  },
  dentist: {
    label: 'Dentist',
    filters: [['amenity', 'dentist'], ['healthcare', 'dentist']],
  },
  pharmacy: {
    label: 'Pharmacy',
    filters: [['amenity', 'pharmacy'], ['healthcare', 'pharmacy']],
  },
  laboratory: {
    label: 'Laboratory',
    filters: [['healthcare', 'laboratory'], ['healthcare', 'blood_donation']],
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);
export const SEARCH_TYPES = ['all', ...CATEGORY_KEYS];

export function filtersForType(type) {
  if (type === 'all') return CATEGORY_KEYS.flatMap((key) => CATEGORIES[key].filters);
  return CATEGORIES[type]?.filters || [];
}

/** Determine the category of an OSM element from its tags (first match wins). */
export function categorize(tags = {}) {
  for (const key of CATEGORY_KEYS) {
    if (CATEGORIES[key].filters.some(([k, v]) => tags[k] === v)) return key;
  }
  return 'other';
}

export const categoryLabel = (key) => CATEGORIES[key]?.label || 'Healthcare facility';
