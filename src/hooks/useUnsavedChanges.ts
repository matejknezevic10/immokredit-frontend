// src/hooks/useUnsavedChanges.ts
import { useEffect, useRef } from 'react';

/**
 * Hook to warn users about unsaved changes when navigating away.
 * Works with BrowserRouter (no Data Router required).
 * Intercepts: tab close, browser back/forward, and SPA navigation.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Browser tab close / reload
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Intercept SPA navigation (React Router uses pushState/replaceState)
  useEffect(() => {
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    const intercept = (original: typeof history.pushState) => {
      return function (this: History, state: any, title: string, url?: string | URL | null) {
        if (isDirtyRef.current) {
          const confirmed = window.confirm(
            'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?'
          );
          if (!confirmed) return;
        }
        return original.call(this, state, title, url);
      };
    };

    history.pushState = intercept(originalPushState);
    history.replaceState = intercept(originalReplaceState);

    // Also handle browser back/forward
    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      const confirmed = window.confirm(
        'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?'
      );
      if (!confirmed) {
        // Push current URL back to cancel navigation
        originalPushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
