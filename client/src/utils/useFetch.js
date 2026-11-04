import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';

export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!!path);

  const load = useCallback(() => {
    if (!path) return;
    setLoading(true);
    setError(null);
    api.get(path).then(setData).catch(setError).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(load, [load]);
  return { data, error, loading, reload: load, setData };
}
