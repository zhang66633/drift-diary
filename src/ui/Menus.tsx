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
        className="max-w-lg w-full max-h-[80vh] overflow-y-auto p-8"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f4ecd8',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
          border: '1px solid #7a5a30',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="save-menu-title" className="text-xl font-bold" style={{ color: '#3a2a15', textIndent: 0 }}>
            {mode === 'save' ? '保存进度' : '读取进度'}
          </h2>
          <button
            className="text-sm px-3 py-1"
            onClick={handleClose}
            style={{ color: '#7a5a30', border: '1px solid #7a5a30', background: 'transparent', cursor: 'pointer' }}
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
  const { getHistoryList, openHistory, closeHistoryMenu, returnToMenu } = useGameStore();
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
        className="max-w-lg w-full max-h-[80vh] overflow-y-auto p-8"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f4ecd8',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
          border: '1px solid #7a5a30',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="history-menu-title" className="text-xl font-bold" style={{ color: '#3a2a15', textIndent: 0 }}>
            历程回顾
          </h2>
          <button
            className="text-sm px-3 py-1"
            onClick={closeHistoryMenu}
            style={{ color: '#7a5a30', border: '1px solid #7a5a30', background: 'transparent', cursor: 'pointer' }}
          >
            关闭
          </button>
        </div>

        {history.length === 0 ? (
          <p className="italic text-center py-8" style={{ color: '#8a7050', textIndent: 0 }}>
            （历程空空如也，你的故事才刚刚开始）
          </p>
        ) : (
          <div>
            {history.map((snap, idx) => (
              <div
                key={`${snap.sceneId}_${idx}`}
                className="p-4 mb-3 cursor-pointer transition-all hover:opacity-80"
                onClick={() => {
                  openHistory(snap);
                  closeHistoryMenu();
                }}
                style={{
                  border: '1px solid #c4a87c',
                  background: '#efe6d0',
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
                  <span className="text-xs" style={{ color: '#a08868', textIndent: 0 }}>
                    ▸
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4" style={{ borderTop: '1px dashed #c4a87c' }}>
          <button
            className="w-full py-3 text-sm"
            onClick={() => {
              if (confirm('确定要返回主菜单吗？未保存的进度将会丢失。')) {
                returnToMenu();
              }
            }}
            style={{ color: '#8a4030', border: '1px solid #c48878', background: 'transparent', cursor: 'pointer' }}
          >
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}

export function HistoryViewOverlay() {
  const { historyView, closeHistory } = useGameStore();

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
        className="max-w-2xl w-full max-h-[85vh] overflow-y-auto p-10"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f4ecd8',
          boxShadow: '0 0 80px rgba(0,0,0,0.6)',
          border: '1px solid #7a5a30',
        }}
      >
        <div className="mb-6 text-center">
          <p className="text-sm" style={{ color: '#7a5a30', textIndent: 0 }}>
            — 回顾 —
          </p>
          <h3 id="history-view-title" className="text-lg mt-2 font-bold" style={{ color: '#3a2a15', textIndent: 0 }}>
            {historyView.title || historyView.sceneId}
          </h3>
          {historyView.date && (
            <p className="text-sm mt-1" style={{ color: '#8a7050', textIndent: 0 }}>
              {historyView.date}
            </p>
          )}
        </div>

        {historyView.text.map((p, i) => (
          <p key={i} className="mb-4" style={{ color: '#5a4635' }}>
            {p}
          </p>
        ))}

        {historyView.choiceText && (
          <p className="mt-6 pt-4 italic text-right" style={{ color: '#7a5a30', borderTop: '1px dashed #c4a87c', textIndent: 0 }}>
            你选择了：{historyView.choiceText}
          </p>
        )}

        <p
          className="text-right mt-8 text-sm cursor-pointer select-none"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={closeHistory}
        >
          （合上 ▸）
        </p>
      </div>
    </div>
  );
}
