import { useGameStore } from '../store/gameStore';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getScenePreview(sceneText: string): string {
  const text = sceneText.replace(/\n/g, ' ').trim();
  return text.length > 30 ? text.slice(0, 30) + '……' : text;
}

interface SaveMenuProps {
  mode: 'save' | 'load';
}

export function SaveMenu({ mode }: SaveMenuProps) {
  const {
    currentScene,
    listSaves,
    save,
    load,
    deleteSave,
    closeSaveMenu,
    closeLoadMenu,
  } = useGameStore();

  const slots = listSaves();
  const manualSlots = slots.filter(s => s.type === 'manual');
  const autoSlot = slots.find(s => s.type === 'auto');

  const handleClose = () => {
    if (mode === 'save') closeSaveMenu();
    else closeLoadMenu();
  };

  const handleSlotClick = (slotId: string, label: string) => {
    if (mode === 'save') {
      save(slotId, label);
      closeSaveMenu();
    } else {
      load(slotId);
      closeLoadMenu();
    }
  };

  const handleDelete = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个存档吗？')) {
      deleteSave(slotId);
    }
  };

  const renderSlot = (index: number) => {
    const slotId = `manual_${index}`;
    const existing = manualSlots.find(s => s.id === slotId);
    const label = existing ? existing.label : `存档 ${index}`;

    return (
      <div
        key={slotId}
        className="p-4 mb-3 cursor-pointer transition-all hover:opacity-80"
        onClick={() => handleSlotClick(slotId, label)}
        style={{
          border: '1px solid #c4a87c',
          background: existing ? '#efe6d0' : 'rgba(244, 236, 216, 0.5)',
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold" style={{ color: '#5a4635', textIndent: 0 }}>
              {label}
            </p>
            {existing ? (
              <>
                <p className="text-sm mt-1" style={{ color: '#7a5a30', textIndent: 0 }}>
                  {formatTime(existing.timestamp)}
                </p>
                <p className="text-sm mt-1 italic" style={{ color: '#8a7050', textIndent: 0 }}>
                  {getScenePreview(existing.sceneText)}
                </p>
              </>
            ) : (
              <p className="text-sm mt-1 italic" style={{ color: '#a08868', textIndent: 0 }}>
                空存档位
              </p>
            )}
          </div>
          {existing && (
            <button
              className="text-xs px-2 py-1 ml-2"
              onClick={e => handleDelete(e, slotId)}
              style={{ color: '#8a4030', border: '1px solid #c48878', background: 'transparent', cursor: 'pointer' }}
            >
              删除
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAutoSlot = () => {
    if (!autoSlot && mode === 'save') return null;
    if (!autoSlot) {
      return (
        <div
          className="p-4 mb-3"
          style={{
            border: '1px dashed #c4a87c',
            background: 'rgba(244, 236, 216, 0.3)',
            opacity: 0.5,
          }}
        >
          <p className="italic text-sm" style={{ color: '#a08868', textIndent: 0 }}>
            （自动存档会在关键节点自动生成）
          </p>
        </div>
      );
    }
    return (
      <div
        className="p-4 mb-3 cursor-pointer transition-all hover:opacity-80"
        onClick={() => mode === 'load' && handleSlotClick(autoSlot.id, '自动存档')}
        style={{
          border: '1px solid #a08858',
          background: mode === 'load' ? '#ede4ce' : 'rgba(244, 236, 216, 0.4)',
          cursor: mode === 'load' ? 'pointer' : 'default',
        }}
      >
        <p className="font-bold" style={{ color: '#6a5030', textIndent: 0 }}>
          自动存档
        </p>
        <p className="text-sm mt-1" style={{ color: '#7a5a30', textIndent: 0 }}>
          {formatTime(autoSlot.timestamp)}
        </p>
        <p className="text-sm mt-1 italic" style={{ color: '#8a7050', textIndent: 0 }}>
          {getScenePreview(autoSlot.sceneText)}
        </p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-menu-title"
      style={{ background: 'rgba(42, 31, 20, 0.75)' }}
      onClick={handleClose}
    >
      <div
        className="max-w-lg w-full max-h-[80vh] overflow-y-auto p-8 overlay-panel"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] mb-1" style={{ color: '#7a5a30', opacity: 0.6, textIndent: 0 }}>
              {mode === 'save' ? '保 存' : '读 取'}
            </p>
            <h2 id="save-menu-title" className="text-xl font-semibold" style={{ color: '#3a2a15', textIndent: 0, letterSpacing: '0.1em' }}>
              {mode === 'save' ? '保存进度' : '读取进度'}
            </h2>
          </div>
          <button
            className="text-sm px-4 py-1.5 transition-all duration-200 hover:opacity-80"
            onClick={handleClose}
            style={{
              color: '#7a5a30',
              border: '1px solid #7a5a30',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            关闭
          </button>
        </div>

        {renderAutoSlot()}

        <div className="mt-2">
          {[1, 2, 3, 4, 5, 6].map(i => renderSlot(i))}
        </div>

        {mode === 'save' && !currentScene && (
          <p className="text-sm text-center mt-4 italic" style={{ color: '#a04030', textIndent: 0 }}>
            （游戏未开始时无法存档）
          </p>
        )}
      </div>
    </div>
  );
}

export function HistoryMenu() {
  const getHistoryList = useGameStore(s => s.getHistoryList);
  const openHistory = useGameStore(s => s.openHistory);
  const closeHistoryMenu = useGameStore(s => s.closeHistoryMenu);
  const returnToMenu = useGameStore(s => s.returnToMenu);
  const history = getHistoryList();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-menu-title"
      style={{ background: 'rgba(42, 31, 20, 0.75)' }}
      onClick={closeHistoryMenu}
    >
      <div
        className="max-w-lg w-full max-h-[80vh] overflow-y-auto p-8 overlay-panel"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] mb-1" style={{ color: '#7a5a30', opacity: 0.6, textIndent: 0 }}>
              回 顾
            </p>
            <h2 id="history-menu-title" className="text-xl font-semibold" style={{ color: '#3a2a15', textIndent: 0, letterSpacing: '0.1em' }}>
              历程回顾
            </h2>
          </div>
          <button
            className="text-sm px-4 py-1.5 transition-all duration-200 hover:opacity-80"
            onClick={closeHistoryMenu}
            style={{
              color: '#7a5a30',
              border: '1px solid #7a5a30',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            关闭
          </button>
        </div>

        {history.length === 0 ? (
          <p className="italic text-center py-12" style={{ color: '#8a7050', textIndent: 0 }}>
            历程空空如也，你的故事才刚刚开始
          </p>
        ) : (
          <div>
            {history.map((snap, idx) => (
              <div
                key={`${snap.sceneId}_${idx}`}
                className="p-4 mb-3 cursor-pointer transition-all duration-200 hover:opacity-80"
                onClick={() => {
                  openHistory(snap);
                  closeHistoryMenu();
                }}
                style={{
                  border: '1px solid #c4a87c',
                  background: 'rgba(239, 230, 208, 0.6)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#efe6d0';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(239, 230, 208, 0.6)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: '#7a5a30', textIndent: 0 }}>
                      {snap.date ? `${snap.date} · ` : ''}{snap.title || snap.sceneId}
                    </p>
                    {snap.choiceText && (
                      <p className="text-sm mt-1 italic" style={{ color: '#8a7050', textIndent: 0 }}>
                        → {snap.choiceText}
                      </p>
                    )}
                  </div>
                  <span className="text-xs ml-3 flex-shrink-0" style={{ color: '#a08868', textIndent: 0 }}>
                    ▸
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6" style={{ borderTop: '1px dashed #c4a87c' }}>
          <button
            className="w-full py-2.5 text-sm transition-all duration-200 hover:opacity-80"
            onClick={() => {
              if (confirm('确定要返回主菜单吗？未保存的进度将会丢失。')) {
                returnToMenu();
              }
            }}
            style={{
              color: '#8a4030',
              border: '1px solid #c48878',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}

export function HistoryViewOverlay() {
  const historyView = useGameStore(s => s.historyView);
  const closeHistory = useGameStore(s => s.closeHistory);

  if (!historyView) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-view-title"
      style={{ background: 'rgba(42, 31, 20, 0.85)' }}
      onClick={closeHistory}
    >
      <div
        className="max-w-2xl w-full max-h-[85vh] overflow-y-auto p-10 overlay-panel"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-8 text-center">
          <p className="text-sm tracking-[0.3em]" style={{ color: '#7a5a30', textIndent: 0, opacity: 0.7 }}>
            — 回 顾 —
          </p>
          <h3
            id="history-view-title"
            className="text-lg mt-3 font-semibold"
            style={{ color: '#3a2a15', textIndent: 0, letterSpacing: '0.1em' }}
          >
            {historyView.title || historyView.sceneId}
          </h3>
          {historyView.date && (
            <p className="text-sm mt-2 italic" style={{ color: '#8a7050', textIndent: 0 }}>
              {historyView.date}
            </p>
          )}
        </div>

        <div className="border-t border-b py-6 my-4" style={{ borderColor: 'rgba(122, 90, 48, 0.3)' }}>
          {historyView.text.map((p, i) => (
            <p key={i} className="mb-5 leading-loose last:mb-0" style={{ color: '#5a4635' }}>
              {p}
            </p>
          ))}
        </div>

        {historyView.choiceText && (
          <p
            className="mt-6 pt-4 italic text-right"
            style={{ color: '#7a5a30', borderTop: '1px dashed #c4a87c', textIndent: 0 }}
          >
            你选择了：{historyView.choiceText}
          </p>
        )}

        <p
          className="text-right mt-8 text-sm cursor-pointer select-none transition-opacity hover:opacity-70"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={closeHistory}
        >
          合上 ▸
        </p>
      </div>
    </div>
  );
}
