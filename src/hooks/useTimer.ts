import { useRef, useCallback } from 'react';

export function useTimer() {
  const startTime = useRef<number>(0);

  const start = useCallback(() => {
    startTime.current = Date.now();
  }, []);

  const elapsed = useCallback(() => {
    return Date.now() - startTime.current;
  }, []);

  return { start, elapsed };
}
