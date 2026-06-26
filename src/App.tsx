import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { MainMenu } from './ui/MainMenu';
import { BookShell } from './ui/BookShell';
import { SaveMenu } from './ui/Menus';
import { ErrorBoundary } from './ui/ErrorBoundary';

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

  useEffect(() => {
    init();
    if (typeof window !== 'undefined' && isDebugMode) {
      window.__gameStore = useGameStore;
    }
  }, [init, isDebugMode]);

  if (!initialized) {
    return (
      <div className="book-shell flex items-center justify-center">
        <p style={{ color: '#7a5a30', textIndent: 0 }}>手稿正在展开……</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {showMainMenu ? <MainMenu /> : <BookShell />}
      {showLoadMenu && <SaveMenu mode="load" />}
    </ErrorBoundary>
  );
}
