import { useEffect, useState, lazy, Suspense } from 'react';
import { useGameStore } from './store/gameStore';
import { MainMenu } from './ui/MainMenu';
import { BookShell } from './ui/BookShell';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { AudioHint } from './ui/AudioHint';
import { LoadingScreen } from './ui/LoadingScreen';
import { preloadCriticalResources } from './utils/preload';

const SaveMenu = lazy(() => import('./ui/Menus').then(m => ({ default: m.SaveMenu })));

declare global {
  interface Window {
    __gameStore: typeof useGameStore;
  }
}

export default function App() {
  const showMainMenu = useGameStore(s => s.showMainMenu);
  const showLoadMenu = useGameStore(s => s.showLoadMenu);
  const initialized = useGameStore(s => s.initialized);
  const init = useGameStore(s => s.init);
  const isDebugMode = useGameStore(s => s.isDebugMode);

  const [resourcesReady, setResourcesReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    init();
    if (typeof window !== 'undefined' && isDebugMode) {
      window.__gameStore = useGameStore;
    }
  }, [init, isDebugMode]);

  useEffect(() => {
    if (!initialized) return;

    let cancelled = false;

    preloadCriticalResources({
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
  }, [initialized]);

  if (!initialized || !resourcesReady) {
    return <LoadingScreen progress={loadProgress} />;
  }

  return (
    <ErrorBoundary>
      {showMainMenu ? <MainMenu /> : <BookShell />}
      <Suspense fallback={null}>
        {showLoadMenu && <SaveMenu mode="load" />}
      </Suspense>
      <AudioHint />
    </ErrorBoundary>
  );
}
