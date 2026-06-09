import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError, classifyError } from '../api/client.js';

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

export default function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList,
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reloadCounter = useRef(0);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    reloadCounter.current += 1;
    setTick(reloadCounter.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchFn()
      .then(result => { if (!cancelled) setData(result); })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiClientError ? classifyError(err) : 'Failed to load');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload };
}
