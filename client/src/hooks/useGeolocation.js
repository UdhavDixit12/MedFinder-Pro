import { useCallback, useState } from 'react';

const MESSAGES = {
  1: 'Location permission was denied. You can still search by typing a city or address.',
  2: 'Your location could not be determined. Please search by city or address instead.',
  3: 'Getting your location took too long. Please try again or search by city.',
};

/**
 * Browser geolocation that only runs when the user explicitly asks for it.
 */
export default function useGeolocation() {
  const [status, setStatus] = useState('idle'); // idle | locating | success | error
  const [error, setError] = useState(null);

  const locate = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          const err = { code: 'UNSUPPORTED', message: 'Your browser does not support location access. Please search by city or address.' };
          setStatus('error');
          setError(err);
          reject(err);
          return;
        }
        setStatus('locating');
        setError(null);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setStatus('success');
            resolve({
              lat: Number(position.coords.latitude.toFixed(6)),
              lon: Number(position.coords.longitude.toFixed(6)),
              accuracy: position.coords.accuracy,
            });
          },
          (geoError) => {
            const err = { code: geoError.code === 1 ? 'DENIED' : 'FAILED', message: MESSAGES[geoError.code] || MESSAGES[2] };
            setStatus('error');
            setError(err);
            reject(err);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
        );
      }),
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);

  return { locate, status, error, clearError, locating: status === 'locating' };
}
