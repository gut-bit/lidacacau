import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface UseFetchOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  loadOnFocus?: boolean;
}

interface UseFetchResult<T> {
  data: T;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T>>;
}

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const { 
    initialData,
    onSuccess,
    onError,
    loadOnFocus = true 
  } = options;
  
  const defaultData = (initialData !== undefined ? initialData : null) as T;

  const [data, setData] = useState<T>(defaultData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFn, onSuccess, onError]);

  const refetch = useCallback(() => execute(false), [execute]);
  const refresh = useCallback(() => execute(true), [execute]);

  useFocusEffect(
    useCallback(() => {
      if (loadOnFocus) {
        execute(false);
      }
    }, [...deps, loadOnFocus])
  );

  return {
    data,
    loading,
    refreshing,
    error,
    refetch,
    refresh,
    setData,
  };
}

export function useLoadingState(initialLoading = true) {
  const [loading, setLoading] = useState(initialLoading);
  const [refreshing, setRefreshing] = useState(false);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  const startRefresh = useCallback(() => setRefreshing(true), []);
  const stopRefresh = useCallback(() => setRefreshing(false), []);

  return {
    loading,
    refreshing,
    setLoading,
    setRefreshing,
    startLoading,
    stopLoading,
    startRefresh,
    stopRefresh,
  };
}
