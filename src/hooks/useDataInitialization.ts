import { useState, useEffect, useRef } from 'react';
import database from '../database/client';
import { seedIfNeeded } from '../utils/seedDatabase';

export function useDataInitialization(migrationSuccess: boolean): {
  ready: boolean;
  error: string | null;
} {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!migrationSuccess || hasStarted.current) return;
    hasStarted.current = true;

    seedIfNeeded(database)
      .then(() => setReady(true))
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
  }, [migrationSuccess]);

  return { ready, error };
}
