import { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { MainMenu } from './ui/MainMenu';
import { BookShell } from './ui/BookShell';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { AudioHint } from './ui/AudioHint';
import { LoadingScreen } from './ui/LoadingScreen';
import { preloadCriticalResources, getPreloadMode } from './utils/preload';

const SaveMenu = lazy(() => import('./ui/Menus').then(m => ({ default: m.SaveMenu })));

declare global {
  interface Window {
    __gameStore: typeof useGameStore;
  }
}

export default function App() {
  const showMainMenu = useGameStore(s => s.showMainMenu);
  const showLoadMenu = useGameStore(s => s.showLoadMenu);
  const showSaveMenu = useGameStore(s => s.showSaveMenu);
  const initialized = useGameStore(s => s.initialized);
  const init = useGameStore(s => s.init);

  const [resourcesReady, setResourcesReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    init();
    if (typeof window !== 'undefined') {
      window.__gameStore = useGameStore;
    }
  }, [init]);

  const handleSkip = useCallback(() => {
    setSkipped(true);
    setResourcesReady(true);
  }, []);

  useEffect(() => {
    if (!initialized || skipped) return;

    let cancelled = false;

    preloadCriticalResources({
      mode: getPreloadMode(),
      onProgress: (p) => {
        if (!cancelled) setLoadProgress(p);
      },
    }).then(() => {
      if (!cancelled) {
        setTimeout(() => setResourcesReady(true), 200);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialized, skipped]);

  if (!initialized || !resourcesReady) {
    return (
      <LoadingScreen
        progress={loadProgress}
        onSkip={handleSkip}
        showSkip={getPreloadMode() === 'full'}
      />
    );
  }

  return (
    <ErrorBoundary>
      {showMainMenu ? <MainMenu /> : <BookShell />}
      <Suspense fallback={null}>
        {showSaveMenu && <SaveMenu mode="save" />}
        {showLoadMenu && <SaveMenu mode="load" />}
      </Suspense>
      <AudioHint />
    </ErrorBoundary>
  );
}
