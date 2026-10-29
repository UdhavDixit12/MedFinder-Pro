import { Link } from 'react-router-dom';
import Brand from './Brand.jsx';

const GROUPS = [
  {
    title: 'Find care',
    links: [
      { to: '/hospitals?type=hospital', label: 'Hospitals' },
      { to: '/hospitals?type=clinic', label: 'Clinics' },
      { to: '/hospitals?type=pharmacy', label: 'Pharmacies' },
      { to: '/hospitals?type=dentist', label: 'Dentists' },
    ],
  },
  {
    title: 'Health tools',
    links: [
      { to: '/symptoms', label: 'Symptom checker' },
      { to: '/emergency', label: 'Emergency assistance' },
      { to: '/dashboard', label: 'Saved facilities' },
    ],
  },
  {
    title: 'About',
    links: [
      { to: '/about', label: 'About MedFinder Pro' },
      { to: '/about#data', label: 'Data sources & limitations' },
      { href: 'https://www.openstreetmap.org/fixthemap', label: 'Report a map error' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Brand />
            <p className="max-w-xs text-sm leading-relaxed text-slate-600">
              Find nearby hospitals, clinics and pharmacies using open map data. Information may be incomplete — always confirm
              with the facility.
            </p>
          </div>
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-slate-900">{group.title}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-brand-700">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to} className="text-slate-600 hover:text-brand-700">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-2 border-t border-slate-100 pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            Facility data ©{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-700">
              OpenStreetMap contributors
            </a>
            , available under the Open Database License (ODbL). Search via the Overpass API; geocoding by Nominatim. MedFinder Pro
            does not verify listings.
          </p>
          <p>
            MedFinder Pro provides general information only and is not a substitute for professional medical advice. In an
            emergency in India, call <a href="tel:112" className="font-semibold text-red-700 underline">112</a> or{' '}
            <a href="tel:102" className="font-semibold text-red-700 underline">102</a> (ambulance).
          </p>
          <p>© {new Date().getFullYear()} MedFinder Pro.</p>
        </div>
      </div>
    </footer>
  );
}
