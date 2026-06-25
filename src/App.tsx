import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { MainMenu } from './ui/MainMenu';
import { BookShell } from './ui/BookShell';
import { SaveMenu } from './ui/Menus';

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

  useEffect(() => {
    init();
    if (typeof window !== 'undefined') {
      window.__gameStore = useGameStore;
    }
  }, [init]);

  if (!initialized) {
    return (
      <div className="book-shell flex items-center justify-center">
        <p style={{ color: '#7a5a30', textIndent: 0 }}>手稿正在展开……</p>
      </div>
    );
  }

  return (
    <>
      {showMainMenu ? <MainMenu /> : <BookShell />}
      {showLoadMenu && <SaveMenu mode="load" />}
    </>
  );
}
