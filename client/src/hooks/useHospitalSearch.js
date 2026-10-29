import { useCallback, useEffect, useRef, useState } from 'react';
import { hospitalService } from '../services/index.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

export const searchKey = ({ location, lat, lon, radius, type }) =>
  lat != null && lon != null
    ? `c:${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}|${radius}|${type}`
    : `l:${(location || '').trim().toLowerCase()}|${radius}|${type}`;

/**
 * Runs a live hospital search whenever params change (debounced).
 * The last successful result is kept separately from errors, so the UI can
 * show "stale" results while clearly reporting a failed search.
 */
export default function useHospitalSearch(params, { enabled = true, debounceMs = 350 } = {}) {
  const key = searchKey(params);
  const [state, setState] = useState({ loading: false, error: null, result: null, resultKey: null, resultAt: null });
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!state.loading) {
      setSlow(false);
      return undefined;
    }
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [state.loading]);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    if (!enabled) return undefined;

    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setState({ loading: false, error: null, result: cached.result, resultKey: key, resultAt: cached.at });
      return undefined;
    }

    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    const timer = setTimeout(async () => {
      try {
        const result = await hospitalService.search(paramsRef.current, controller.signal);
        const at = Date.now();
        cache.set(key, { result, at });
        setState({ loading: false, error: null, result, resultKey: key, resultAt: at });
      } catch (error) {
        if (error.cancelled) return;
        setState((s) => ({ ...s, loading: false, error }));
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, enabled, attempt, debounceMs]);

  const retry = useCallback(() => {
    cache.delete(key);
    setAttempt((n) => n + 1);
  }, [key]);

  const isCurrent = state.result != null && state.resultKey === key;

  return {
    loading: state.loading,
    /** True when the current request has been running for a while. */
    slow,
    error: state.error,
    result: state.result,
    resultAt: state.resultAt,
    /** True when the displayed result does not belong to the current search. */
    isStale: state.result != null && (!isCurrent || Boolean(state.error)),
    isCurrent,
    retry,
  };
}
