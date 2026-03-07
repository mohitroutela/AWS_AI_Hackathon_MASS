import { useState, useEffect } from 'react';
import { APIResponse, Visualization } from '../types/visualization.types';

interface UsePageDataResult {
  data: Visualization[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePageData(fetchFunction: () => Promise<APIResponse>): UsePageDataResult {
  const [data, setData] = useState<Visualization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchFunction();
      if (response.data) {
        setData(response.data);
      }
    } catch (err) {
      console.error('Failed to load page data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: loadData
  };
}
