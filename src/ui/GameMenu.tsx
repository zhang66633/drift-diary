import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { EndingCollection } from './EndingCollection';

interface GameMenuProps {
  onClose: () => void;
}

interface MenuItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
}

function MenuItem({ icon, label, onClick, danger, last }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className="w-full py-2.5 px-4 text-left transition-all duration-150 flex items-center gap-3"
      style={{
        color: danger ? '#8a4030' : '#3a2a15',
        borderBottom: last ? 'none' : '1px solid #e0d4b8',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '0.95rem',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(90, 66, 32, 0.07)';
        (e.currentTarget as HTMLButtonElement).style.paddingLeft = '1.25rem';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.paddingLeft = '1rem';
      }}
    >
      <span
        style={{
          fontSize: '0.8rem',
          width: '1.5rem',
          textAlign: 'center',
          fontFamily: 'serif',
          opacity: danger ? 0.8 : 0.6,
        }}
      >
        {icon}
      </span>
      <span style={{ letterSpacing: '0.05em' }}>{label}</span>
    </button>
  );
}

export function GameMenu({ onClose }: GameMenuProps) {
  const [showEndings, setShowEndings] = useState(false);

  const {
    openSaveMenu,
    openLoadMenu,
    openSettingsMenu,
    openMemoir,
    returnToMenu,
    closeGameMenu,
  } = useGameStore();

  const handleClick = (action: () => void) => {
    return () => {
      closeGameMenu();
      action();
    };
  };

  const handleReturnToMenu = () => {
    if (confirm('确定要返回主菜单吗？未保存的进度将会丢失。')) {
      closeGameMenu();
      returnToMenu();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(42, 31, 20, 0.25)' }}
        onClick={onClose}
      >
        <div
          role="menu"
          aria-label="游戏菜单"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '46px',
            right: '16px',
            width: '230px',
            background: '#f4ecd8',
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.65 0 0 0 0 0.55 0 0 0 0 0.40 0 0 0 0.03 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")
            `,
            border: '1px solid #7a5a30',
            boxShadow: '4px 6px 30px rgba(0,0,0,0.35), 0 0 20px rgba(122, 90, 48, 0.1)',
            zIndex: 51,
            transformOrigin: 'top right',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #d4c4a8' }}>
            <span
              className="text-xs tracking-[0.3em]"
              style={{ color: '#7a5a30', opacity: 0.6 }}
            >
              菜 单
            </span>
          </div>

          <div style={{ padding: '4px 0' }}>
            <MenuItem icon="✧" label="航海图" onClick={handleClick(openMemoir)} />
            <MenuItem icon="◆" label="终点 · 结局收录" onClick={() => setShowEndings(true)} />
            <MenuItem icon="◇" label="保存进度" onClick={handleClick(openSaveMenu)} />
            <MenuItem icon="◈" label="读取进度" onClick={handleClick(openLoadMenu)} />
            <MenuItem icon="※" label="设置" onClick={handleClick(openSettingsMenu)} />
          </div>

          <div style={{ borderTop: '1px solid #c4a87c', margin: '2px 0' }} />

          <div style={{ padding: '4px 0' }}>
            <MenuItem icon="◈" label="返回主菜单" onClick={handleReturnToMenu} danger />
            <MenuItem icon="×" label="关闭菜单" onClick={handleClick(() => {})} last />
          </div>
        </div>
      </div>
      {showEndings && <EndingCollection onClose={() => setShowEndings(false)} />}
    </>
  );
}
