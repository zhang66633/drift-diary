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
import { checkConditionWithManagers, formatChineseDate } from '../utils/helpers';
import type { Choice } from '../types/scene';

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

  const checkCond = (cond: Choice['condition'] | Choice['requirement']) =>
    checkConditionWithManagers(cond, flagMgr, stateMgr, providence);

  const visibleChoices = useMemo(() => {
    if (!currentScene?.choices) return [];
    return currentScene.choices.filter(c => checkCond(c.condition));
  }, [currentScene, flagMgr, stateMgr, providence]);

  const disabledChoiceIds = useMemo(() => {
    const ids = new Set<string>();
    if (!currentScene?.choices) return ids;
    for (const c of visibleChoices) {
      if (!c.requirement) continue;
      if (!checkCond(c.requirement)) ids.add(c.id);
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

  const dateStr = currentScene.date ? formatChineseDate(currentScene.date) : null;

  const hasBlockingEnterOverlay =
    (pendingNarration?.trigger === 'on_enter') ||
    (pendingDream?.trigger === 'on_enter') ||
    chapterTitleVisible ||
    !!pendingDeath ||
    !!pendingEnding;

  const illustration = currentScene?.illustration;
  const showIllustration = !!illustration?.cached && !hasBlockingEnterOverlay && !isTyping;

  return (
    <div className="book-shell">
      <StatusBar
        showGameMenu={showGameMenu}
        onToggleMenu={() => showGameMenu ? closeGameMenu() : openGameMenu()}
      />

      {/* Fullpage illustration: immersive background */}
      {showIllustration && illustration?.position === 'fullpage' && (
        <div className="illustration-fullpage" aria-hidden="true">
          <img
            src={`data:image/png;base64,${illustration.cached}`}
            alt={illustration.alt}
            className="illustration-fullpage-img"
          />
          <div className="illustration-fullpage-overlay" />
        </div>
      )}

      <div
        className={`book-page${showIllustration && illustration?.position === 'fullpage' ? ' book-page-fullpage' : ''}`}
        style={{ opacity: hasBlockingEnterOverlay ? 0.15 : 1, transition: 'opacity 0.3s ease' }}
      >
        {dateStr && !chapterTitleVisible && (
          <div className="mb-6">
            <span className="date-badge">{dateStr}</span>
          </div>
        )}

        {resolvedQuotation && !chapterTitleVisible && !hasBlockingEnterOverlay && (
          <p className="quotation">{resolvedQuotation}</p>
        )}

        {/* Top/inline illustration */}
        {showIllustration && illustration?.position !== 'fullpage' && (
          <div
            className={`illustration-container illustration-${illustration?.position}`}
            style={{
              transform: contentVisible ? 'translateY(0)' : 'translateY(6px)',
              transition: 'transform 0.6s ease-out',
            }}
          >
            <img
              src={`data:image/png;base64,${illustration!.cached}`}
              alt={illustration!.alt}
              className={`illustration-img illustration-img-${illustration?.position}`}
            />
          </div>
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
                  transform: contentVisible ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'transform 0.6s ease-out',
                }}
              >
                {resolvedParagraphs.map((p, i) => (
                  <p key={i} className="mb-4">{p}</p>
                ))}
                <div
                  style={{
                    transform: contentVisible ? 'translateY(0)' : 'translateY(8px)',
                    transition: 'transform 0.6s ease-out 0.15s',
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
