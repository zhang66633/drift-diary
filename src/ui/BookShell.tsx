import { useMemo, useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { StatusBar } from './StatusBar';
import { TypedText } from './TypedText';
import { ChoiceList } from './ChoiceList';
import { NarrationOverlay, DreamOverlay, DeathOverlay, ChapterTitleOverlay, EndingOverlay } from './Overlays';
import { SaveMenu, HistoryViewOverlay } from './Menus';
import { GameMenu } from './GameMenu';
import { SettingsPanel } from './SettingsPanel';
import { Memoir } from './Memoir';

export function BookShell() {
  const {
    currentScene,
    pendingNarration,
    pendingDream,
    pendingDeath,
    pendingEnding,
    pendingChoiceNarration,
    isTyping,
    chapterTitleVisible,
    showSaveMenu,
    showLoadMenu,
    showSettingsMenu,
    showGameMenu,
    showMemoir,
    chooseChoice,
    dismissNarration,
    dismissDream,
    dismissDeath,
    dismissEnding,
    dismissChapterTitle,
    openGameMenu,
    closeGameMenu,
    closeSettingsMenu,
    closeMemoir,
    _consequence: consequence,
    _flagMgr: flagMgr,
    _stateMgr: stateMgr,
    _providence: providence,
    _sceneMgr: sceneMgr,
  } = useGameStore();

  const resolvedParagraphs = useMemo(() => {
    if (!currentScene) return [];
    return currentScene.text.map(t => consequence.resolveText(t));
  }, [currentScene, consequence]);

  const resolvedQuotation = useMemo(() => {
    if (!currentScene?.quotation) return null;
    return consequence.resolveText(currentScene.quotation);
  }, [currentScene, consequence]);

  const visibleChoices = useMemo(() => {
    if (!currentScene?.choices) return [];
    return currentScene.choices.filter(c => {
      if (!c.condition) return true;
      return flagMgr.checkCondition(
        c.condition,
        () => stateMgr.getState() as unknown as Record<string, number>,
        () => {
          const r = stateMgr.getResources();
          return {
            钱: r.钱, 食物: r.食物, 淡水: r.淡水, 火药: r.火药, 弹药: r.弹药,
            工具: r.工具, 蜡: r.蜡, 绳: r.绳, 装备: r.装备, 墨水: r.墨水,
          };
        },
        () => stateMgr.getSkills() as unknown as Record<string, number>,
        () => providence.getValue(),
      );
    });
  }, [currentScene, flagMgr, stateMgr, providence]);

  const disabledChoiceIds = useMemo(() => {
    const ids = new Set<string>();
    if (!currentScene?.choices) return ids;
    for (const c of visibleChoices) {
      if (!c.requirement) continue;
      const satisfied = flagMgr.checkCondition(
        c.requirement,
        () => stateMgr.getState() as unknown as Record<string, number>,
        () => {
          const r = stateMgr.getResources();
          return {
            钱: r.钱, 食物: r.食物, 淡水: r.淡水, 火药: r.火药, 弹药: r.弹药,
            工具: r.工具, 蜡: r.蜡, 绳: r.绳, 装备: r.装备, 墨水: r.墨水,
          };
        },
        () => stateMgr.getSkills() as unknown as Record<string, number>,
        () => providence.getValue(),
      );
      if (!satisfied) ids.add(c.id);
    }
    return ids;
  }, [visibleChoices, flagMgr, stateMgr, providence]);

  const narrationText = useMemo(() => {
    if (pendingNarration) return consequence.resolveText(pendingNarration.text);
    if (pendingChoiceNarration) return consequence.resolveText(pendingChoiceNarration.text);
    return null;
  }, [pendingNarration, pendingChoiceNarration, consequence]);

  const dreamText = useMemo(() => {
    if (!pendingDream) return undefined;
    return consequence.resolveText(pendingDream.text);
  }, [pendingDream, consequence]);

  const chapterData = useMemo(() => {
    if (!currentScene || !chapterTitleVisible) return null;
    const ch = sceneMgr.getCurrentChapter();
    return ch;
  }, [currentScene, chapterTitleVisible, sceneMgr]);

  // 打字完成后的淡入动画状态
  const [contentVisible, setContentVisible] = useState(false);
  const prevTypingRef = useRef(isTyping);

  useEffect(() => {
    // 当打字从 true 变成 false 时，触发淡入动画
    if (prevTypingRef.current === true && isTyping === false) {
      setContentVisible(true);
    }
    prevTypingRef.current = isTyping;
  }, [isTyping]);

  // 场景切换时重置动画状态
  useEffect(() => {
    setContentVisible(false);
  }, [currentScene?.id]);

  const onTypingComplete = () => {
    useGameStore.setState({ isTyping: false });
  };

  if (!currentScene) {
    return (
      <div className="book-shell flex items-center justify-center">
        <p style={{ color: '#7a5a30' }}>加载中……</p>
      </div>
    );
  }

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const cn = ['正','二','三','四','五','六','七','八','九','十','十一','十二'];
    return `${y}年${cn[m-1]}月${d}日`;
  };

  const dateStr = formatDate(currentScene.date);

  const hasBlockingEnterOverlay =
    (pendingNarration?.trigger === 'on_enter') ||
    (pendingDream?.trigger === 'on_enter') ||
    chapterTitleVisible ||
    !!pendingDeath ||
    !!pendingEnding;

  return (
    <div className="book-shell">
      <StatusBar />

      <button
        className="fixed top-4 right-4 z-30 flex flex-col items-center justify-center gap-[5px] transition-opacity hover:opacity-100"
        onClick={() => showGameMenu ? closeGameMenu() : openGameMenu()}
        style={{
          color: '#7a5a30',
          border: '1px solid #c4a87c',
          background: 'rgba(244, 236, 216, 0.9)',
          cursor: 'pointer',
          opacity: showGameMenu ? 1 : 0.7,
          width: '34px',
          height: '32px',
          padding: 0,
        }}
        title="菜单"
      >
        <span style={{ display: 'block', width: '14px', height: '1px', background: '#7a5a30' }} />
        <span style={{ display: 'block', width: '14px', height: '1px', background: '#7a5a30' }} />
        <span style={{ display: 'block', width: '14px', height: '1px', background: '#7a5a30' }} />
      </button>

      <div className="book-page" style={{ opacity: hasBlockingEnterOverlay ? 0.15 : 1, transition: 'opacity 0.3s ease' }}>
        {dateStr && !chapterTitleVisible && (
          <div className="mb-6">
            <span className="date-badge">{dateStr}</span>
          </div>
        )}

        {resolvedQuotation && !chapterTitleVisible && !hasBlockingEnterOverlay && (
          <p className="quotation">{resolvedQuotation}</p>
        )}

        {!hasBlockingEnterOverlay && (
          <div>
            {isTyping && (
              <TypedText
                key={currentScene.id}
                paragraphs={resolvedParagraphs}
                onComplete={onTypingComplete}
              />
            )}
            {!isTyping && (
              <div
                style={{
                  opacity: contentVisible ? 1 : 0,
                  transform: contentVisible ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                }}
              >
                {resolvedParagraphs.map((p, i) => (
                  <p key={i} className="mb-4">{p}</p>
                ))}
                <div
                  style={{
                    opacity: contentVisible ? 1 : 0,
                    transform: contentVisible ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
                  }}
                >
                  {visibleChoices.length > 0 && (
                    <ChoiceList
                      choices={visibleChoices}
                      onChoose={chooseChoice}
                      disabledIds={disabledChoiceIds}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {chapterData && (
        <ChapterTitleOverlay
          chapter={chapterData.chapter}
          title={chapterData.title}
          quotation={chapterData.quotation}
          visible={chapterTitleVisible}
          onDismiss={dismissChapterTitle}
        />
      )}

      <NarrationOverlay
        narration={pendingNarration ?? pendingChoiceNarration}
        text={narrationText ?? ''}
        onDismiss={dismissNarration}
      />

      <DreamOverlay dream={pendingDream} resolvedDreamText={dreamText} onDismiss={dismissDream} />

      <DeathOverlay death={pendingDeath} onDismiss={dismissDeath} />

      <EndingOverlay ending={pendingEnding} onDismiss={dismissEnding} />

      {showSaveMenu && <SaveMenu mode="save" />}
      {showLoadMenu && <SaveMenu mode="load" />}
      {showSettingsMenu && <SettingsPanel onClose={closeSettingsMenu} />}
      {showGameMenu && <GameMenu onClose={closeGameMenu} />}
      {showMemoir && <Memoir onClose={closeMemoir} />}
      <HistoryViewOverlay />
    </div>
  );
}
