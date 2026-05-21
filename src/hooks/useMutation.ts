import { useCallback, useState } from 'react';

export interface MutationState {
  /** True while a mutation is in flight. */
  pending: boolean;
  /** Last error message, or null. */
  error: string | null;
  clearError: () => void;
  /**
   * Runs an async mutation, tracking pending/error.
   * Resolves true on success, false on failure (error captured).
   */
  run: (fn: () => Promise<unknown>) => Promise<boolean>;
}

/**
 * Generic mutation state for create/update actions. Keeps module hooks
 * free of repeated try/catch/pending boilerplate.
 */
export function useMutation(): MutationState {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<unknown>): Promise<boolean> => {
    setPending(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, run, clearError: () => setError(null) };
}
