import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { favouriteService } from '../services/index.js';
import { useAuth } from './AuthContext.jsx';

const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [favourites, setFavourites] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(() => new Set());

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await favouriteService.list();
      setFavourites(data.favourites);
      setStatus('ready');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    } else {
      setFavourites([]);
      setStatus('idle');
    }
  }, [isAuthenticated, load]);

  const ids = useMemo(() => new Set(favourites.map((f) => f.id)), [favourites]);
  const isFavourite = useCallback((id) => ids.has(id), [ids]);
  const isPending = useCallback((id) => pending.has(id), [pending]);

  const markPending = (id, on) =>
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const add = useCallback(async (facility) => {
    markPending(facility.id, true);
    try {
      const data = await favouriteService.add(facility);
      setFavourites((prev) => [data.favourite, ...prev.filter((f) => f.id !== data.favourite.id)]);
      return data.favourite;
    } finally {
      markPending(facility.id, false);
    }
  }, []);

  const remove = useCallback(async (osmType, osmId) => {
    const id = `${osmType}/${osmId}`;
    markPending(id, true);
    try {
      await favouriteService.remove(osmType, osmId);
      setFavourites((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      if (err.status === 404) setFavourites((prev) => prev.filter((f) => f.id !== id));
      else throw err;
    } finally {
      markPending(id, false);
    }
  }, []);

  const value = useMemo(
    () => ({ favourites, status, error, reload: load, isFavourite, isPending, add, remove }),
    [favourites, status, error, load, isFavourite, isPending, add, remove],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used within FavouritesProvider');
  return ctx;
}
