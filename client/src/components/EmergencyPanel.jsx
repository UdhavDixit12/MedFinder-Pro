import { useNavigate } from 'react-router-dom';
import { Ambulance, Building2, LocateFixed, Phone, Siren } from 'lucide-react';
import Button from './ui/Button.jsx';
import Alert from './ui/Alert.jsx';
import useGeolocation from '../hooks/useGeolocation.js';
import { cn } from '../utils/cn.js';

export const EMERGENCY_NUMBERS = [
  { number: '112', title: 'National Emergency', description: 'Single emergency number for police, fire and medical help across India.' },
  { number: '108', title: 'Emergency Ambulance', description: 'State emergency ambulance service in Haryana and many other states.' },
  { number: '102', title: 'Ambulance', description: 'Government ambulance service in many states, often for pregnant women and infants.' },
];

export default function EmergencyPanel({ compact = false, className, onFindNearby }) {
  const navigate = useNavigate();
  const { locate, locating, error } = useGeolocation();

  const findNearest = async (useLocation) => {
    if (useLocation) {
      try {
        const { lat, lon } = await locate();
        if (onFindNearby) onFindNearby({ lat, lon });
        else navigate(`/hospitals?lat=${lat}&lon=${lon}&radius=10000&type=hospital`);
      } catch {
        // error shown below; manual search remains available
      }
      return;
    }
    if (onFindNearby) onFindNearby(null);
    else navigate('/hospitals?type=hospital&radius=10000');
  };

  return (
    <div className={cn('rounded-2xl border border-red-200 bg-white shadow-card', className)}>
      <div className="flex flex-col gap-3 rounded-t-2xl border-b border-red-100 bg-red-50 p-5 sm:flex-row sm:items-start">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-600 text-white">
          <Siren className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-red-900">In a life-threatening emergency, call 112 immediately</h2>
          <p className="mt-1 text-sm leading-relaxed text-red-800">
            Signs include chest pain, severe difficulty breathing, unconsciousness, stroke symptoms, severe bleeding or a
            serious injury. Do not wait for online information.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <ul className={cn('grid gap-3', compact ? 'sm:grid-cols-3' : 'md:grid-cols-3')}>
          {EMERGENCY_NUMBERS.map((item) => (
            <li key={item.number} className="flex flex-col rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Ambulance className="h-4 w-4 text-red-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              </div>
              {!compact && <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">{item.description}</p>}
              <Button
                href={`tel:${item.number}`}
                variant="emergency"
                icon={Phone}
                className="mt-3 w-full"
                aria-label={`Call ${item.number}, ${item.title}`}
              >
                Call {item.number}
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" icon={Building2} onClick={() => findNearest(false)} className="sm:flex-1">
            Find nearest hospitals
          </Button>
          <Button variant="outline" icon={LocateFixed} loading={locating} onClick={() => findNearest(true)} className="sm:flex-1">
            Use my location
          </Button>
        </div>
        {error && <Alert tone="warning">{error.message}</Alert>}

        <p className="text-xs leading-relaxed text-slate-500">
          Tapping a number only opens your phone’s dialer — MedFinder Pro does not place calls, share your location or dispatch
          an ambulance, and cannot confirm that any service or hospital is available right now. Service numbers can vary by
          state.
        </p>
      </div>
    </div>
  );
}
