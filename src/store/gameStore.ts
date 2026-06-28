import { create } from 'zustand';
import type { GameState, SceneSnapshot } from '../types/state';
import type { Scene, NarrationSpec, DreamSpec, DeathSpec, EndingSpec, Condition } from '../types/scene';
import type { SaveSlot } from '../types/save';
import { createInitialState } from '../types/state';
import { StateManager } from '../engine/StateManager';
import { FlagManager } from '../engine/FlagManager';
import { TimeManager } from '../engine/TimeManager';
import { ProvidenceEngine } from '../engine/ProvidenceEngine';
import { ConsequenceEngine, type EventCallback } from '../engine/ConsequenceEngine';
import { SceneManager } from '../engine/SceneManager';
import { AudioManager } from '../engine/AudioManager';
import { SaveManager, localStorageAdapter } from '../engine/SaveManager';
import { validateChapter } from '../engine/schema';
import { useSettings } from './settingsStore';
import { getResourceMap } from '../utils/helpers';

/** 保留专属 BGM 的特殊场景——其它场景统一使用 main_theme */
const KEEP_BGM_SCENES = new Set([
  'ch2_3_被俘',    // 海盗战斗
  'ch2_4_为奴',    // 选择拿多少食物
  'ch2_15_远航',   // 最后一个遇险
]);

interface GameStore {
  // Internal managers (exposed for UI integration, prefixed with _)
  _stateMgr: StateManager;
  _flagMgr: FlagManager;
  _timeMgr: TimeManager;
  _providence: ProvidenceEngine;
  _consequence: ConsequenceEngine;
  _sceneMgr: SceneManager;
  _saveMgr: SaveManager;
  _audio: AudioManager;

  // UI-facing state
  currentScene: Scene | null;
  pendingNarration: NarrationSpec | null;
  pendingDream: DreamSpec | null;
  pendingDeath: DeathSpec | null;
  pendingEnding: EndingSpec | null;
  isTyping: boolean;
  isDebugMode: boolean;
  historyView: SceneSnapshot | null;
  chapterTitleVisible: boolean;
  initialized: boolean;
  showMainMenu: boolean;
  pendingNextScene: string | null;
  pendingChoiceNarration: NarrationSpec | null;
  showSaveMenu: boolean;
  showLoadMenu: boolean;
  showHistoryMenu: boolean;
  showSettingsMenu: boolean;
  showGameMenu: boolean;
  showMemoir: boolean;

  // Derived state (snapshots for reactivity)
  gameState: GameState;

  // Actions
  init(): Promise<void>;
  startNewGame(): Promise<void>;
  chooseChoice(choiceId: string): Promise<void>;
  confirmMultiChoice(optionIds: string[]): Promise<void>;
  nextParagraph(): void;
  skipTyping(): void;
  dismissNarration(): Promise<void>;
  dismissDream(): void;
  dismissDeath(): Promise<void>;
  dismissEnding(): void;
  toggleDebug(): void;
  openHistory(snapshot: SceneSnapshot): void;
  closeHistory(): void;
  save(slotId: string, label: string): void;
  load(slotId: string): Promise<void>;
  deleteSave(slotId: string): void;
  listSaves(): SaveSlot[];
  getHistoryList(): SceneSnapshot[];
  getMemoirData(): { chapters: import('../types/scene').Chapter[]; history: string[]; currentId: string; snapshots: SceneSnapshot[] };
  dismissChapterTitle(): void;
  openSaveMenu(): void;
  closeSaveMenu(): void;
  openLoadMenu(): void;
  closeLoadMenu(): void;
  openHistoryMenu(): void;
  closeHistoryMenu(): void;
  openSettingsMenu(): void;
  closeSettingsMenu(): void;
  openGameMenu(): void;
  closeGameMenu(): void;
  openMemoir(): void;
  closeMemoir(): void;
  returnToMenu(): void;
}

function buildGameState(
  stateMgr: StateManager,
  flagMgr: FlagManager,
  timeMgr: TimeManager,
  sceneMgr: SceneManager,
  snapshots: SceneSnapshot[],
): GameState {
  return {
    state: { ...stateMgr.getState() },
    resources: {
      ...stateMgr.getResources(),
      同伴: [...stateMgr.getResources().同伴],
    },
    skills: { ...stateMgr.getSkills() },
    flags: { ...flagMgr.getAllFlags() },
    time: { ...timeMgr.getTime() },
    currentSceneId: sceneMgr.getCurrentSceneId(),
    history: [...sceneMgr.getHistory()],
    historySnapshots: [...snapshots],
  };
}

function takeSnapshot(scene: Scene, text: string[], timeMgr: TimeManager, choiceText?: string): SceneSnapshot {
  return {
    sceneId: scene.id,
    chapter: scene.chapter,
    beat: scene.beat,
    title: scene.beat,
    date: scene.date ?? timeMgr.getDate(),
    text: [...text],
    quotation: scene.quotation,
    illustrationCached: scene.illustration?.cached,
    choiceText,
    timestamp: Date.now(),
  };
}

export const useGameStore = create<GameStore>((set, get) => {
  // Singleton managers (created once, reset on new game/load)
  const initial = createInitialState();
  const stateMgr = new StateManager(initial.state, initial.resources, initial.skills);
  const flagMgr = new FlagManager(initial.flags);
  const timeMgr = new TimeManager(initial.time);
  const providence = new ProvidenceEngine(stateMgr);
  const audio = new AudioManager();
  const sceneMgr = new SceneManager();
  const saveMgr = new SaveManager(localStorageAdapter);

  let snapshots: SceneSnapshot[] = [];
  let pendingReturnMenu = false;

  const onEvent: EventCallback = (eventName) => {
    if (eventName === 'return_menu') {
      pendingReturnMenu = true;
    }
  };

  const consequence = new ConsequenceEngine({
    stateManager: stateMgr,
    flagManager: flagMgr,
    timeManager: timeMgr,
    providenceEngine: providence,
    onEvent,
  });

  function refreshState(extra?: Partial<GameStore>): void {
    set({
      gameState: buildGameState(stateMgr, flagMgr, timeMgr, sceneMgr, snapshots),
      ...extra,
    });
  }

  function checkCondition(condition: Condition | undefined): boolean {
    if (!condition) return true;
    return flagMgr.checkCondition(
      condition,
      () => stateMgr.getState() as unknown as Record<string, number>,
      () => getResourceMap(stateMgr.getResources()),
      () => stateMgr.getSkills() as unknown as Record<string, number>,
      () => providence.getValue(),
    );
  }

  async function enterScene(sceneId: string): Promise<void> {
    await sceneMgr.ensureSceneLoaded(sceneId);
    const scene = sceneMgr.goToScene(sceneId);

    if (scene.date) {
      timeMgr.setDate(scene.date);
    }
    if (scene.chapter && flagMgr.getFlag('在岛上')) {
      timeMgr.setOnIsland(true);
    }

    const wasSept1 = timeMgr.isSeptemberFirst();

    consequence.execute(scene.onEnter);

    // 环境音切换
    const ambientKey = scene.audio?.ambient ?? 'waves';
    audio.playAmbient(ambientKey);
    if (scene.audio?.sfx) {
      audio.playSfx(scene.audio.sfx);
    }

    // 背景音乐切换：大多数场景统一主旋律，特殊场景保留原BGM
    const bgmKey = scene.audio?.bgm;
    if (scene.ending || KEEP_BGM_SCENES.has(scene.id)) {
      // 结局 / 海盗战斗 / 遇险 / 食物选择 → 使用场景专属BGM
      if (bgmKey) audio.playBgm(bgmKey);
    } else {
      audio.playBgm('main_theme');
    }

    // 预加载下一章（场景接近章节末尾时后台加载下一章JSON + 结局资源）
    const chSceneCount = sceneMgr.getChapterSceneCount(scene.chapter);
    const chSceneIndex = sceneMgr.getCurrentChapter()?.scenes.findIndex(s => s.id === scene.id) ?? -1;
    if (chSceneIndex >= 0 && chSceneIndex >= chSceneCount - 2) {
      sceneMgr.preloadNextChapter(scene.chapter);
      // 后台预加载当前章节结局的 BGM 和插图，进入结局时丝滑无等待
      const chapter = sceneMgr.getCurrentChapter();
      if (chapter) {
        const endingScene = chapter.scenes.find(s => !!s.ending);
        if (endingScene) {
          // BGM 预加载到浏览器缓存
          const endingBgm = endingScene.audio?.bgm;
          if (endingBgm) audio.preloadBgm(endingBgm);
          // 插图预加载到浏览器缓存
          const endingImg = endingScene.illustration?.src;
          if (endingImg) {
            const img = new Image();
            img.src = import.meta.env.BASE_URL + endingImg.replace(/^\//, '');
          }
        }
      }
    }

    const hookEffects = providence.checkHook(scene.providenceHook);
    if (hookEffects) consequence.execute(hookEffects);

    let pendingDeath: DeathSpec | null = null;
    if (stateMgr.getState().健康 <= 0) {
      pendingDeath = {
        text: '手稿在此处中断……墨水化在潮气里，再也看不清后面的字。',
      };
    }

    const resolvedText = scene.text.map(t => consequence.resolveText(t));
    const snapshot = takeSnapshot(scene, resolvedText, timeMgr);
    snapshots.push(snapshot);

    let pendingNarration: NarrationSpec | null = null;
    if (scene.narration?.trigger === 'on_enter') {
      const narrationText = consequence.resolveText(scene.narration.text);
      if (checkCondition(scene.narration.condition) && narrationText) {
        pendingNarration = { ...scene.narration, text: narrationText };
      }
    }

    let pendingDream: DreamSpec | null = null;
    if (scene.dream?.trigger === 'on_enter') {
      pendingDream = scene.dream;
    }

    let pendingEnding: EndingSpec | null = null;
    if (scene.ending) {
      pendingEnding = {
        ...scene.ending,
        moneyText: consequence.resolveText(scene.ending.moneyText) as any,
      };
      saveMgr.unlockEnding(scene.id);
    }

    if (wasSept1 && timeMgr.isSeptemberFirst() && !scene.chapterStart && !scene.dream) {
      pendingNarration = {
        text: '正是八年前的这个日子——一六五一年九月一日，我违抗父命，从赫尔港出走。冥冥中自有天意，这个日子注定要成为我命运的刻度。',
        trigger: 'on_enter',
      };
    }

    const chapterTitleVisible = scene.chapterStart === true;
    const hasBlockingOverlay = chapterTitleVisible || !!pendingNarration || !!pendingDream || !!pendingDeath || !!pendingEnding;

    if (!scene.ending) {
      saveMgr.autoSave(
        `第${scene.chapter}章 · ${scene.beat}`,
        buildGameState(stateMgr, flagMgr, timeMgr, sceneMgr, snapshots),
        resolvedText[0] ?? '',
      );
    }

    refreshState({
      currentScene: scene,
      pendingNarration,
      pendingDream,
      pendingDeath,
      pendingEnding,
      isTyping: !hasBlockingOverlay,
      chapterTitleVisible,
    });
  }

  const store: GameStore = {
    _stateMgr: stateMgr,
    _flagMgr: flagMgr,
    _timeMgr: timeMgr,
    _providence: providence,
    _consequence: consequence,
    _sceneMgr: sceneMgr,
    _saveMgr: saveMgr,
    _audio: audio,
    currentScene: null,
    pendingNarration: null,
    pendingDream: null,
    pendingDeath: null,
    pendingEnding: null,
    isTyping: false,
    isDebugMode: false,
    historyView: null,
    chapterTitleVisible: false,
    initialized: false,
    showMainMenu: true,
    pendingNextScene: null,
    pendingChoiceNarration: null,
    gameState: initial,
    showSaveMenu: false,
    showLoadMenu: false,
    showHistoryMenu: false,
    showSettingsMenu: false,
    showGameMenu: false,
    showMemoir: false,

    async init() {
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            useSettings.getState().toggleDebug();
            set({ isDebugMode: useSettings.getState().debugMode });
          }
          if (e.key === 'Escape') {
            const s = get();
            if (s.showGameMenu) s.closeGameMenu();
            else if (s.showMemoir) s.closeMemoir();
            else if (s.showSettingsMenu) s.closeSettingsMenu();
            else if (s.showSaveMenu) s.closeSaveMenu();
            else if (s.showLoadMenu) s.closeLoadMenu();
          }
        });
      }
      set({ initialized: true, showMainMenu: true, isDebugMode: useSettings.getState().debugMode });
      useSettings.subscribe(settings => {
        set({ isDebugMode: settings.debugMode });
        audio.setMasterVolume(settings.volume);
        audio.setSfxVolume(settings.sfxVolume);
      });
      // 首次用户点击时初始化 AudioContext
      const initAudio = () => {
        audio.init();
        audio.setMasterVolume(useSettings.getState().volume);
        audio.setSfxVolume(useSettings.getState().sfxVolume);
        audio.playBgm('main_theme');
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
      };
      window.addEventListener('click', initAudio);
      window.addEventListener('keydown', initAudio);
      refreshState();
    },

    async startNewGame() {
      const fresh = createInitialState();
      stateMgr.reset(fresh.state, fresh.resources, fresh.skills);
      flagMgr.reset(fresh.flags);
      timeMgr.reset(fresh.time);
      sceneMgr.reset();
      snapshots = [];

      const ch1 = await sceneMgr.loadChapter(1);
      const validCh1 = validateChapter(ch1);
      sceneMgr.loadChapterSync(validCh1);
      const firstScene = ch1.scenes[0];
      if (!firstScene) throw new Error('Chapter 1 has no scenes');
      sceneMgr.setInitialScene(firstScene.id);
      set({ showMainMenu: false });
      await enterScene(firstScene.id);
      refreshState();
    },

    async chooseChoice(choiceId: string) {
      const scene = get().currentScene;
      if (!scene || !scene.choices) return;
      const choice = scene.choices.find(c => c.id === choiceId);
      if (!choice) return;

      if (!checkCondition(choice.requirement)) return;

      audio.playSfx('page_turn');

      if (snapshots.length > 0) {
        const lastSnap = snapshots[snapshots.length - 1];
        if (lastSnap.sceneId === scene.id) {
          lastSnap.choiceText = choice.text;
        }
      }

      if (choice.death) {
        set({ pendingDeath: choice.death });
        return;
      }

      consequence.execute(choice.consequences);

      const hookEffects = providence.checkHook(scene.providenceHook);
      if (hookEffects) consequence.execute(hookEffects);

      if (choice.narration?.trigger === 'on_choice') {
        const narrationText = consequence.resolveText(choice.narration.text);
        if (checkCondition(choice.narration.condition) && narrationText) {
          set({ pendingChoiceNarration: { ...choice.narration, text: narrationText }, pendingNextScene: choice.nextScene ?? null });
        } else if (choice.nextScene) {
          await enterScene(choice.nextScene);
        }
      } else if (choice.nextScene) {
        await enterScene(choice.nextScene);
      }
    },

    async confirmMultiChoice(optionIds: string[]) {
      const scene = get().currentScene;
      if (!scene || !scene.multiChoice) return;
      const mc = scene.multiChoice;

      if (mc.minSelect !== undefined && optionIds.length < mc.minSelect) return;
      if (mc.maxSelect !== undefined && optionIds.length > mc.maxSelect) return;

      if (snapshots.length > 0) {
        const lastSnap = snapshots[snapshots.length - 1];
        if (lastSnap.sceneId === scene.id) {
          const selectedTexts = optionIds
            .map(oid => mc.options.find(o => o.id === oid)?.text)
            .filter(Boolean);
          lastSnap.choiceText = selectedTexts.join('、');
        }
      }

      for (const oid of optionIds) {
        const opt = mc.options.find(o => o.id === oid);
        if (opt) consequence.execute(opt.consequences);
      }

      const hookEffects = providence.checkHook(scene.providenceHook);
      if (hookEffects) consequence.execute(hookEffects);

      if (mc.narration?.trigger === 'on_choice') {
        const narrationText = consequence.resolveText(mc.narration.text);
        if (checkCondition(mc.narration.condition) && narrationText) {
          set({ pendingChoiceNarration: { ...mc.narration, text: narrationText }, pendingNextScene: mc.nextScene });
        } else {
          await enterScene(mc.nextScene);
        }
      } else {
        await enterScene(mc.nextScene);
      }
    },

    nextParagraph() {
      set({ isTyping: false });
    },

    skipTyping() {
      set({ isTyping: false });
    },

    async dismissNarration() {
      const next = get().pendingNextScene;
      const wasOnEnter = get().pendingNarration?.trigger === 'on_enter';
      set({ pendingNarration: null, pendingChoiceNarration: null, pendingNextScene: null });
      if (pendingReturnMenu) {
        pendingReturnMenu = false;
        snapshots = [];
        refreshState({
          currentScene: null,
          isTyping: false,
          chapterTitleVisible: false,
          pendingDream: null,
          pendingDeath: null,
          historyView: null,
          showGameMenu: false,
          showMemoir: false,
          showSettingsMenu: false,
          showMainMenu: true,
        });
        return;
      }
      if (next) {
        await enterScene(next);
      } else {
        set({ isTyping: wasOnEnter ? true : get().isTyping });
      }
    },

    dismissDream() {
      set({ pendingDream: null, isTyping: true });
    },

    dismissChapterTitle() {
      set({ chapterTitleVisible: false, isTyping: true });
    },

    dismissEnding() {
      set({
        pendingEnding: null,
        currentScene: null,
        isTyping: false,
        chapterTitleVisible: false,
        pendingDream: null,
        pendingDeath: null,
        pendingNarration: null,
        pendingChoiceNarration: null,
        pendingNextScene: null,
        historyView: null,
        showGameMenu: false,
        showMemoir: false,
        showSettingsMenu: false,
        showMainMenu: true,
      });
      snapshots = [];
      audio.playBgm('main_theme');
    },

    async dismissDeath() {
      const death = get().pendingDeath;
      set({ pendingDeath: null });
      if (death?.reviveScene) {
        await enterScene(death.reviveScene);
      } else {
        const latest = saveMgr.getLatestSave();
        if (latest) {
          await get().load(latest.id);
        } else {
          await get().startNewGame();
        }
      }
    },

    toggleDebug() {
      useSettings.getState().toggleDebug();
      set({ isDebugMode: useSettings.getState().debugMode });
    },

    openHistory(snapshot: SceneSnapshot) {
      set({ historyView: snapshot });
    },

    closeHistory() {
      set({ historyView: null });
    },

    save(slotId: string, label: string) {
      const scene = get().currentScene;
      if (!scene) return;
      saveMgr.save(
        slotId,
        label,
        buildGameState(stateMgr, flagMgr, timeMgr, sceneMgr, snapshots),
        consequence.resolveText(scene.text[0]),
      );
      refreshState();
    },

    async load(slotId: string) {
      const loaded = saveMgr.load(slotId);
      if (!loaded) return;

      stateMgr.reset(loaded.state, loaded.resources, loaded.skills);
      flagMgr.reset(loaded.flags);
      timeMgr.reset(loaded.time);
      sceneMgr.reset();
      sceneMgr.setHistory(loaded.history);
      snapshots = [...loaded.historySnapshots];

      timeMgr.setOnIsland(!!loaded.flags['在岛上']);

      // Determine chapter to load
      const chapterMatch = loaded.currentSceneId.match(/^ch(\d+)_/);
      const chapterNum = chapterMatch ? parseInt(chapterMatch[1]) : 1;

      const ch = await sceneMgr.loadChapter(chapterNum);
      const validCh = validateChapter(ch);
      sceneMgr.loadChapterSync(validCh);
      sceneMgr.setInitialScene(loaded.currentSceneId);

      set({ showMainMenu: false });
      set({ showSaveMenu: false, showLoadMenu: false, showHistoryMenu: false, showSettingsMenu: false, showGameMenu: false, showMemoir: false });
      await enterScene(loaded.currentSceneId);
    },

    deleteSave(slotId: string) {
      saveMgr.deleteSlot(slotId);
      refreshState();
    },

    listSaves() {
      return saveMgr.listSlots();
    },

    getHistoryList() {
      return [...snapshots].reverse();
    },

    openSaveMenu() {
      set({ showSaveMenu: true });
    },
    closeSaveMenu() {
      set({ showSaveMenu: false });
    },
    openLoadMenu() {
      set({ showLoadMenu: true });
    },
    closeLoadMenu() {
      set({ showLoadMenu: false });
    },
    openHistoryMenu() {
      set({ showHistoryMenu: true });
    },
    closeHistoryMenu() {
      set({ showHistoryMenu: false });
    },
    openSettingsMenu() {
      set({ showSettingsMenu: true });
    },
    closeSettingsMenu() {
      set({ showSettingsMenu: false });
    },
    openGameMenu() {
      set({ showGameMenu: true });
    },
    closeGameMenu() {
      set({ showGameMenu: false });
    },
    openMemoir() {
      set({ showMemoir: true });
    },
    closeMemoir() {
      set({ showMemoir: false });
    },
    getMemoirData() {
      return {
        chapters: sceneMgr.getLoadedChapters(),
        history: [...sceneMgr.getHistory()],
        currentId: sceneMgr.getCurrentSceneId(),
        snapshots: [...snapshots],
      };
    },
    returnToMenu() {
      set({
        showMainMenu: true,
        showSaveMenu: false,
        showLoadMenu: false,
        showHistoryMenu: false,
        showSettingsMenu: false,
        showGameMenu: false,
        showMemoir: false,
        historyView: null,
      });
    },
  };

  return store;
});
