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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saveMgr = useGameStore.getState()._saveMgr;
    setLatestSlot(saveMgr.getLatestSave());
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleNewGame = () => {
    if (latestSlot && !confirm('开始新游戏将不会覆盖现有存档，确定要开始吗？')) {
      return;
    }
    startNewGame();
  };

  return (
    <div className="book-shell">
      <div className="flex flex-col items-center justify-center min-h-full py-16">
        <div
          className="max-w-lg w-full px-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1s ease-out, transform 1s ease-out',
          }}
        >
          <div className="text-center mb-14">
            <div className="mb-6 flex justify-center gap-3" style={{ color: '#7a5a30', opacity: 0.5 }}>
              <span>❦</span>
              <span>❧</span>
              <span>❦</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl font-semibold mb-5"
              style={{
                color: '#1a1008',
                letterSpacing: '0.35em',
                textIndent: 0,
                textShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              鲁滨孙漂流记
            </h1>

            <p className="text-sm italic tracking-widest" style={{ color: '#7a5a30', textIndent: 0 }}>
              —— 文 字 冒 险 ——
            </p>

            <div className="my-10 mx-auto max-w-sm relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#7a5a30] to-transparent opacity-40" />
              <div className="relative z-10 px-6 py-5">
                <p className="italic text-center leading-relaxed" style={{ color: '#5a4220', textIndent: 0, fontSize: '0.95rem' }}>
                  "冥冥之中自有凌驾于一切之上的天意，<br />
                  催逼着我们去毁灭自己。"
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2" style={{ textIndent: 0 }}>
            <MenuButton variant="primary" onClick={handleNewGame}>
              <span className="mr-2" style={{ opacity: 0.6 }}>✧</span>
              翻开新的一页
            </MenuButton>

            {latestSlot && (
              <MenuButton variant="secondary" onClick={() => load(latestSlot.id)}>
                继续阅读 · {latestSlot.label}
              </MenuButton>
            )}

            {latestSlot && (
              <MenuButton variant="secondary" onClick={openLoadMenu}>
                读取其他存档…
              </MenuButton>
            )}

            <MenuButton variant="secondary" onClick={() => setShowMemoir(true)}>
              航海图 · 航程回顾
            </MenuButton>
          </div>

          <div className="mt-14 pt-6 border-t border-dashed" style={{ borderColor: 'rgba(122, 90, 48, 0.2)' }}>
            <p
              className="text-center text-xs leading-relaxed"
              style={{ color: '#9a8060', textIndent: 0, opacity: 0.8 }}
            >
              Ctrl+Shift+D 开启调试模式 · Esc 关闭菜单
            </p>
          </div>
        </div>
      </div>

      {showMemoir && <Memoir standalone onClose={() => setShowMemoir(false)} />}
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-6 transition-all duration-250 text-left group"
      style={{
        color: isPrimary ? '#1a1008' : '#5a4635',
        fontSize: isPrimary ? '1.125rem' : '1rem',
        fontWeight: isPrimary ? 500 : 400,
        borderLeft: '3px solid transparent',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const btn = e.currentTarget as HTMLButtonElement;
        btn.style.background = 'rgba(122, 90, 48, 0.06)';
        btn.style.borderLeftColor = '#7a5a30';
        btn.style.transform = 'translateX(6px)';
      }}
      onMouseLeave={e => {
        const btn = e.currentTarget as HTMLButtonElement;
        btn.style.background = 'transparent';
        btn.style.borderLeftColor = 'transparent';
        btn.style.transform = 'translateX(0)';
      }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  );
}
