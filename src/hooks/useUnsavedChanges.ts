// src/hooks/useUnsavedChanges.ts
import { useEffect, useRef, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook to warn users about unsaved changes when navigating away.
 * Uses browser beforeunload + React Router blocker.
 */
export function useUnsavedChanges(isDirty: boolean) {
  // Browser tab close / reload
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // React Router navigation
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?'
      );
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}

/**
 * Hook to track if form data has changed since last save/load.
 * Returns [isDirty, markClean, markDirty]
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
