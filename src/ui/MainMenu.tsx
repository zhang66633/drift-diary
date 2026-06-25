import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { SaveSlot } from '../types/save';
import { Memoir } from './Memoir';

export function MainMenu() {
  const startNewGame = useGameStore(s => s.startNewGame);
  const load = useGameStore(s => s.load);
  const openLoadMenu = useGameStore(s => s.openLoadMenu);
  const [latestSlot, setLatestSlot] = useState<SaveSlot | null>(null);
  const [showMemoir, setShowMemoir] = useState(false);

  useEffect(() => {
    const saveMgr = useGameStore.getState()._saveMgr;
    setLatestSlot(saveMgr.getLatestSave());
  }, []);

  const handleNewGame = () => {
    if (latestSlot && !confirm('开始新游戏将不会覆盖现有存档，确定要开始吗？')) {
      return;
    }
    startNewGame();
  };

  return (
    <div className="book-shell">
      <div className="flex flex-col items-center justify-center min-h-full py-20">
        <div className="max-w-lg w-full px-8">
          <div className="text-center mb-12">
            <h1
              className="text-4xl font-semibold mb-4"
              style={{ color: '#1a1008', letterSpacing: '0.3em', textIndent: 0 }}
            >
              鲁滨孙漂流记
            </h1>
            <p className="text-sm italic" style={{ color: '#5a4220', textIndent: 0 }}>
              ——文字冒险——
            </p>
            <div className="my-8 border-t border-b py-4" style={{ borderColor: '#7a5a30' }}>
              <p className="italic text-center" style={{ color: '#5a4220', textIndent: 0 }}>
                "冥冥之中自有凌驾于一切之上的天意，<br />
                催逼着我们去毁灭自己。"
              </p>
            </div>
          </div>

          <div className="space-y-3" style={{ textIndent: 0 }}>
            <MenuButton onClick={handleNewGame}>
              翻开新的一页
            </MenuButton>

            {latestSlot && (
              <MenuButton
                isContinue
                onClick={() => load(latestSlot.id)}
              >
                继续阅读 · {latestSlot.label}
              </MenuButton>
            )}

            {latestSlot && (
              <MenuButton isContinue onClick={openLoadMenu}>
                读取其他存档…
              </MenuButton>
            )}

            <MenuButton isContinue onClick={() => setShowMemoir(true)}>
              航海图
            </MenuButton>
          </div>

          <p
            className="text-center mt-16 text-xs"
            style={{ color: '#7a5a30', textIndent: 0 }}
          >
            Ctrl+Shift+D 开启调试模式 · Esc 关闭菜单
          </p>
        </div>
      </div>

      {showMemoir && <Memoir standalone onClose={() => setShowMemoir(false)} />}
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  isContinue = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  isContinue?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-6 transition-all duration-200 text-left"
      style={{
        color: isContinue ? '#5a4635' : '#1a1008',
        fontSize: isContinue ? '1rem' : '1.125rem',
        borderLeft: isContinue ? '3px solid transparent' : '3px solid #7a5a30',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(90, 66, 32, 0.08)';
        if (isContinue) {
          (e.currentTarget as HTMLButtonElement).style.borderLeftColor = '#7a5a30';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        if (isContinue) {
          (e.currentTarget as HTMLButtonElement).style.borderLeftColor = 'transparent';
        }
      }}
    >
      {children}
    </button>
  );
}
