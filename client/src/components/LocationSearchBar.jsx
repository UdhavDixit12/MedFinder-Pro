import { useEffect, useId, useState } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import Button from './ui/Button.jsx';
import Alert from './ui/Alert.jsx';
import useGeolocation from '../hooks/useGeolocation.js';
import { cn } from '../utils/cn.js';

/**
 * Location text search + explicit "use my location" control.
 * Geolocation is only requested when the user presses the button.
 */
export default function LocationSearchBar({ initialValue = '', onSearch, onUseLocation, size = 'md', className, busy = false }) {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);
  const { locate, locating, error: geoError, clearError } = useGeolocation();
  const inputId = useId();
  const errorId = useId();

  useEffect(() => setValue(initialValue), [initialValue]);

  const trimmed = value.trim();
  const invalid = touched && trimmed.length < 2;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (trimmed.length < 2) return;
    clearError();
    onSearch(trimmed);
  };

  const useMyLocation = async () => {
    try {
      const coords = await locate();
      onUseLocation(coords);
    } catch {
      // The hook exposes a user-facing error message; manual search remains available.
    }
  };

  const lg = size === 'lg';

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={submit} role="search" aria-label="Search for healthcare facilities by location" noValidate>
        <div className={cn('flex flex-col gap-2 sm:flex-row', lg && 'rounded-2xl bg-white p-2 shadow-raised ring-1 ring-slate-200')}>
          <div className="relative min-w-0 flex-1">
            <label htmlFor={inputId} className="sr-only">
              City, town, locality or address
            </label>
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id={inputId}
              type="text"
              inputMode="search"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={200}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="City, town, locality or address — e.g. Bhiwani, Haryana"
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? errorId : undefined}
              className={cn(
                'block w-full rounded-xl border bg-white pl-10 pr-3 text-slate-900 placeholder:text-slate-400',
                'focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/20',
                lg ? 'h-12 border-transparent text-base sm:border-slate-200' : 'h-11 border-slate-300 text-sm',
                invalid && 'border-red-400',
              )}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size={lg ? 'lg' : 'md'} icon={Search} loading={busy} className={cn('flex-1 sm:flex-none', !lg && 'h-11')}>
              Search
            </Button>
            {onUseLocation && (
              <Button
                variant="outline"
                size={lg ? 'lg' : 'md'}
                icon={LocateFixed}
                loading={locating}
                onClick={useMyLocation}
                className={cn('flex-1 sm:flex-none', !lg && 'h-11')}
                title="Use your current location (your browser will ask for permission)"
              >
                <span className="sm:hidden lg:inline">My location</span>
                <span className="hidden sm:inline lg:hidden">Locate</span>
              </Button>
            )}
          </div>
        </div>
      </form>
      {invalid && (
        <p id={errorId} className="mt-2 text-sm font-medium text-red-600">
          Please enter at least 2 characters.
        </p>
      )}
      {geoError && (
        <Alert tone="warning" className="mt-3">
          {geoError.message}
        </Alert>
      )}
    </div>
  );
}
