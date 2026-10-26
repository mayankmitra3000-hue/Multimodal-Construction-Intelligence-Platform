import { useCallback, useState } from "react";

import { ApiError } from "../api/client";

export function useAsyncAction<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await task();
      setData(result);
      return result;
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : cause instanceof Error
            ? cause.message
            : "Something went wrong. Please try again.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, run, reset, setError };
}
