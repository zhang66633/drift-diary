import { useGameStore } from '../store/gameStore';

interface GameMenuProps {
  onClose: () => void;
}

interface MenuItemProps {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, onClick, danger }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      className="w-full py-3 px-4 text-left transition-all flex items-center gap-3"
      style={{
        color: danger ? '#8a4030' : '#3a2a15',
        borderBottom: '1px solid #e0d4b8',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '1rem',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(90, 66, 32, 0.06)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <span style={{ fontSize: '0.85rem', width: '1.6rem', textAlign: 'center', fontFamily: 'serif', opacity: 0.75 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export function GameMenu({ onClose }: GameMenuProps) {
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
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(42, 31, 20, 0.3)' }}
      onClick={onClose}
    >
      <div
        role="menu"
        aria-label="游戏菜单"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: '48px',
          right: '16px',
          width: '240px',
          background: '#f4ecd8',
          border: '1px solid #7a5a30',
          boxShadow: '4px 4px 20px rgba(0,0,0,0.3)',
          zIndex: 51,
        }}
      >
        <MenuItem icon="✧" label="航海图" onClick={handleClick(openMemoir)} />
        <MenuItem icon="◆" label="保存进度" onClick={handleClick(openSaveMenu)} />
        <MenuItem icon="◇" label="读取进度" onClick={handleClick(openLoadMenu)} />
        <MenuItem icon="※" label="设置" onClick={handleClick(openSettingsMenu)} />
        <div style={{ borderTop: '1px solid #c4a87c', margin: '4px 0' }} />
        <MenuItem icon="◈" label="返回主菜单" onClick={handleReturnToMenu} danger />
        <MenuItem icon="×" label="关闭菜单" onClick={handleClick(() => {})} />
      </div>
    </div>
  );
}
