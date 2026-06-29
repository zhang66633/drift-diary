import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useGameStore } from '../store/gameStore';
import { StatusBar } from './StatusBar';
import { TypedText } from './TypedText';
import { ChoiceList } from './ChoiceList';
import { NarrationOverlay, DreamOverlay, DeathOverlay, ChapterTitleOverlay, EndingOverlay } from './Overlays';
import { checkConditionWithManagers, formatChineseDate } from '../utils/helpers';
import { OptimizedImage } from './OptimizedImage';
import { getIllustrationPaths, preloadIllustration } from '../utils/imageUtils';
import type { Choice } from '../types/scene';

// 懒加载：非关键 UI 组件按需下载
const SaveMenu = lazy(() => import('./Menus').then(m => ({ default: m.SaveMenu })));
const HistoryViewOverlay = lazy(() => import('./Menus').then(m => ({ default: m.HistoryViewOverlay })));
const GameMenu = lazy(() => import('./GameMenu').then(m => ({ default: m.GameMenu })));
const SettingsPanel = lazy(() => import('./SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const Memoir = lazy(() => import('./Memoir').then(m => ({ default: m.Memoir })));

export function BookShell() {
  // Individual selectors: only re-render when the specific value changes
  const currentScene = useGameStore(s => s.currentScene);
  const pendingNarration = useGameStore(s => s.pendingNarration);
  const pendingDream = useGameStore(s => s.pendingDream);
  const pendingDeath = useGameStore(s => s.pendingDeath);
  const pendingEnding = useGameStore(s => s.pendingEnding);
  const pendingChoiceNarration = useGameStore(s => s.pendingChoiceNarration);
  const isTyping = useGameStore(s => s.isTyping);
  const chapterTitleVisible = useGameStore(s => s.chapterTitleVisible);
  const showSaveMenu = useGameStore(s => s.showSaveMenu);
  const showLoadMenu = useGameStore(s => s.showLoadMenu);
  const showSettingsMenu = useGameStore(s => s.showSettingsMenu);
  const showGameMenu = useGameStore(s => s.showGameMenu);
  const showMemoir = useGameStore(s => s.showMemoir);

  // Managers and actions are stable (set once in store creator) — get from getState()
  const getManagers = () => {
    const s = useGameStore.getState();
    return {
      consequence: s._consequence!,
      flagMgr: s._flagMgr!,
      stateMgr: s._stateMgr!,
      providence: s._providence!,
      sceneMgr: s._sceneMgr!,
      chooseChoice: s.chooseChoice,
      dismissNarration: s.dismissNarration,
      dismissDream: s.dismissDream,
      dismissDeath: s.dismissDeath,
      dismissEnding: s.dismissEnding,
      dismissChapterTitle: s.dismissChapterTitle,
      openGameMenu: s.openGameMenu,
      closeGameMenu: s.closeGameMenu,
      closeSettingsMenu: s.closeSettingsMenu,
      closeMemoir: s.closeMemoir,
    };
  };

  const {
    consequence,
    flagMgr,
    stateMgr,
    providence,
    sceneMgr,
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
  } = getManagers();

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

  // 章节结束场景的点击显示状态
  const [showChapterEndContent, setShowChapterEndContent] = useState(false);
  const isChapterEnd = currentScene?.chapterEnd === true;

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
    setShowChapterEndContent(false);
  }, [currentScene?.id]);

  const illustration = currentScene?.illustration;

  const imgPaths = useMemo(() => {
    if (!illustration?.src) return null;
    return getIllustrationPaths(illustration.src);
  }, [illustration?.src]);

  const imgSrc = imgPaths?.original || null;

  const [imgLoaded, setImgLoaded] = useState(false);

  // Track already-preloaded scene IDs to avoid re-running the effect on every render
  const preloadedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    setImgLoaded(false);
  }, [imgPaths]);

  useEffect(() => {
    if (!currentScene?.id || !currentScene?.choices || !flagMgr || !stateMgr || !providence) return;

    const nextSceneIds: string[] = [];
    for (const choice of currentScene.choices) {
      if (checkConditionWithManagers(choice.condition, flagMgr, stateMgr, providence)) {
        if (choice.nextScene && !preloadedIds.current.has(choice.nextScene)) {
          nextSceneIds.push(choice.nextScene);
          preloadedIds.current.add(choice.nextScene);
        }
      }
    }

    if (nextSceneIds.length === 0) return;

    const preloadNext = async () => {
      for (const sceneId of nextSceneIds) {
        try {
          await sceneMgr.ensureSceneLoaded(sceneId);
          const scene = sceneMgr.getScene(sceneId);
          if (scene?.illustration?.src) {
            preloadIllustration(scene.illustration.src);
          }
        } catch {
          // 静默失败
        }
      }
    };

    const timer = setTimeout(preloadNext, 1500);
    return () => clearTimeout(timer);
  }, [currentScene?.id, sceneMgr, flagMgr, stateMgr, providence]);

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

  // 有插图且不在阻塞遮罩状态下
  const hasIllustration = !!illustration?.src;
  // fullpage 插图始终渲染（作为背景层），inline/top 插图在 blocking overlay 期间隐藏
  const showInlineIllustration = hasIllustration && !hasBlockingEnterOverlay;
  // 图片显示条件：加载完成（打字期间也显示图片，与文字同步体验）
  const showIllustration = showInlineIllustration && imgLoaded;

  return (
    <div className="book-shell">
      <StatusBar
        showGameMenu={showGameMenu}
        onToggleMenu={() => showGameMenu ? closeGameMenu() : openGameMenu()}
      />

      {/* Fullpage illustration: immersive background */}
      {hasIllustration && illustration?.position === 'fullpage' && imgPaths && (
        <div
          className="illustration-fullpage"
          aria-hidden="true"
          style={{
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        >
          <OptimizedImage
            src={imgPaths.original}
            webpSrc={imgPaths.webp}
            lqipSrc={imgPaths.lqip}
            alt={illustration.alt}
            className="illustration-fullpage-img"
            priority={true}
            objectFit="cover"
            onLoad={() => setImgLoaded(true)}
          />
          <div className="illustration-fullpage-overlay" />
        </div>
      )}

      {/* 章节结束场景：点击提示（遮罩消失后即显示，不等图片加载） */}
      {isChapterEnd && !hasBlockingEnterOverlay && !showChapterEndContent && (
        <div
          className="fixed inset-0 flex items-center justify-center z-30 pointer-events-none"
        >
          <div className="text-center" style={{ pointerEvents: 'auto' }}>
            <div
              className="text-base cursor-pointer select-none animate-pulse"
              style={{ color: '#f4ecd8', textIndent: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              onClick={() => setShowChapterEndContent(true)}
            >
              <span className="inline-block mr-2">✦</span>
              点击继续
              <span className="inline-block ml-2">✦</span>
            </div>
          </div>
        </div>
      )}

      <div
        className={`book-page${showIllustration && illustration?.position === 'fullpage' ? ' book-page-fullpage' : ''}`}
        style={{
          opacity: hasBlockingEnterOverlay ? 0 : (isChapterEnd ? (showChapterEndContent ? 1 : 0) : (showIllustration && illustration?.position === 'fullpage' ? (imgLoaded ? 1 : 0) : 1)),
          transform: (isChapterEnd && !showChapterEndContent) ? 'translateY(0)' : (showIllustration && illustration?.position === 'fullpage' && !imgLoaded ? 'translateY(8px)' : 'translateY(0)'),
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          pointerEvents: isChapterEnd && !showChapterEndContent ? 'none' : 'auto',
        }}
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
        {showInlineIllustration && illustration?.position !== 'fullpage' && imgPaths && (
          <div
            className={`illustration-container illustration-${illustration?.position}`}
            style={{
              opacity: showIllustration ? 1 : 0,
              transform: showIllustration ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            <OptimizedImage
              src={imgPaths.original}
              webpSrc={imgPaths.webp}
              lqipSrc={imgPaths.lqip}
              alt={illustration!.alt}
              className={`illustration-img illustration-img-${illustration?.position}`}
              loading="lazy"
              objectFit="cover"
              onLoad={() => setImgLoaded(true)}
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

      <EndingOverlay ending={pendingEnding} illustrationSrc={imgSrc} onDismiss={dismissEnding} />

      <Suspense fallback={null}>
        {showSaveMenu && <SaveMenu mode="save" />}
        {showLoadMenu && <SaveMenu mode="load" />}
      </Suspense>
      <Suspense fallback={null}>
        {showSettingsMenu && <SettingsPanel onClose={closeSettingsMenu} />}
      </Suspense>
      <Suspense fallback={null}>
        {showGameMenu && <GameMenu onClose={closeGameMenu} />}
      </Suspense>
      <Suspense fallback={null}>
        {showMemoir && <Memoir onClose={closeMemoir} />}
      </Suspense>
      <Suspense fallback={null}>
        <HistoryViewOverlay />
      </Suspense>
    </div>
  );
}
