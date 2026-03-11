// src/hooks/useUnsavedChanges.ts
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to warn users about unsaved changes when navigating away.
 * Uses browser beforeunload event (works with BrowserRouter).
 */
export function useUnsavedChanges(isDirty: boolean) {
  // Browser tab close / reload / navigation
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // For in-app navigation: intercept popstate (back/forward buttons)
  useEffect(() => {
    if (!isDirty) return;

    const handlePopState = () => {
      const confirmed = window.confirm(
        'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?'
      );
      if (!confirmed) {
        // Push the current URL back to prevent navigation
        window.history.pushState(null, '', window.location.href);
      }
    };

    // Push a dummy state so we can intercept the back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty]);
}

/**
 * Hook to track if form data has changed since last save/load.
 */
export function useDirtyTracker() {
  const savedRef = useRef<string>('');
  const currentRef = useRef<string>('');
  const dirtyRef = useRef(false);

  const markClean = useCallback((data: any) => {
    const json = JSON.stringify(data);
    savedRef.current = json;
    currentRef.current = json;
    dirtyRef.current = false;
  }, []);

  const checkDirty = useCallback((data: any): boolean => {
    const json = JSON.stringify(data);
    currentRef.current = json;
    dirtyRef.current = json !== savedRef.current;
    return dirtyRef.current;
  }, []);

  return { markClean, checkDirty };
}
