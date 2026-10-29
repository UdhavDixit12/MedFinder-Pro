import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Container } from '../components/ui/Misc.jsx';
import Button from '../components/ui/Button.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const SECTIONS = [
  {
    id: 'mission',
    title: 'What MedFinder Pro does',
    body: [
      'MedFinder Pro helps people in India find nearby hospitals, clinics, doctors, dentists, pharmacies and laboratories, and get directions to them.',
      'The default search location is Bhiwani, Haryana, but you can search any city, town, locality or address.',
    ],
  },
  {
    id: 'data',
    title: 'Where the data comes from',
    body: [
      'Facility listings are retrieved live from OpenStreetMap (OSM) through the Overpass API each time you search. OSM is a free, community-built map; its data is © OpenStreetMap contributors and available under the Open Database License (ODbL).',
      'Place names are converted to coordinates using Nominatim, the OpenStreetMap geocoder. Map tiles are served by the OpenStreetMap Foundation tile servers.',
      'MedFinder Pro does not add, edit or verify listings. Names, addresses, phone numbers and opening hours are shown exactly as recorded in OSM — and where something is not recorded, we say so rather than guessing.',
    ],
  },
  {
    id: 'limitations',
    title: 'Known limitations',
    body: [
      'Coverage varies: some facilities may be missing, closed, duplicated or have outdated details.',
      'A listing does not confirm that a facility is open, has an emergency department, or offers a particular service.',
      'The public OpenStreetMap services are shared infrastructure and can occasionally be slow or unavailable. When that happens we show an error — never sample data.',
      'The symptom checker gives general information only. It is not a diagnosis and does not recommend medicines.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    body: [
      'Your location is only requested when you press "Use my location", and it is used to run that search. We do not store your location history.',
      'If you create an account, we store your name, email, a securely hashed password, an optional home location and the facilities you choose to save.',
    ],
  },
];

export default function AboutPage() {
  useDocumentTitle('About');
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <Container className="py-10 sm:py-12">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">About MedFinder Pro</h1>
        <p className="mt-3 text-slate-600">Open data, honest results, and clear information about what we can and can't tell you.</p>
        <div className="mt-8 space-y-5">
          {SECTIONS.map((s) => (
            <Card key={s.id} id={s.id} as="section" className="scroll-mt-24 p-6">
              <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button to="/hospitals">Search facilities</Button>
          <Button href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener noreferrer" variant="outline">
            Report a map error on OSM
          </Button>
        </div>
      </div>
    </Container>
  );
}
