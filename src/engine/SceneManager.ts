import type { Chapter, Scene } from '../types/scene';

// 动态加载 chapters 目录下的所有 JSON
const chapterModules = import.meta.glob<Chapter>('../data/chapters/ch*.json', { eager: false });

export class SceneManager {
  private chapters = new Map<number, Chapter>();
  private currentSceneId: string = '';
  private chapterData: Chapter | null = null;
  private sceneIndex = new Map<string, { chapter: Chapter; scene: Scene }>();
  private history: string[] = [];

  async loadChapter(chapterNum: number): Promise<Chapter> {
    if (this.chapters.has(chapterNum)) {
      const ch = this.chapters.get(chapterNum)!;
      this.chapterData = ch;
      this.buildIndex(ch);
      return ch;
    }

    // 匹配文件名如 ch1.json, ch2.json
    const key = Object.keys(chapterModules).find(k => {
      const match = k.match(/ch(\d+)\.json$/);
      return match && parseInt(match[1]) === chapterNum;
    });

    if (!key) {
      throw new Error(`Chapter ${chapterNum} not found in data/chapters/`);
    }

    const mod = await chapterModules[key]();
    // import.meta.glob 的 eager:false 返回 { default: Chapter } 或直接 Chapter
    const chapter: Chapter = (mod as unknown as { default?: Chapter }).default ?? (mod as unknown as Chapter);
    this.chapters.set(chapterNum, chapter);
    this.chapterData = chapter;
    this.buildIndex(chapter);
    return chapter;
  }

  loadChapterSync(chapter: Chapter): void {
    this.chapters.set(chapter.chapter, chapter);
    this.chapterData = chapter;
    this.buildIndex(chapter);
  }

  getCurrentChapter(): Chapter | null {
    return this.chapterData;
  }

  getScene(sceneId: string): Scene | null {
    return this.sceneIndex.get(sceneId)?.scene ?? null;
  }

  getCurrentScene(): Scene | null {
    if (!this.currentSceneId) return null;
    return this.getScene(this.currentSceneId);
  }

  getCurrentSceneId(): string {
    return this.currentSceneId;
  }

  async ensureSceneLoaded(sceneId: string): Promise<void> {
    const chapterMatch = sceneId.match(/^ch(\d+)_/);
    if (!chapterMatch) return;
    const chapterNum = parseInt(chapterMatch[1]);
    if (!this.chapters.has(chapterNum)) {
      await this.loadChapter(chapterNum);
    }
  }

  goToScene(sceneId: string): Scene {
    const entry = this.sceneIndex.get(sceneId);
    if (!entry) {
      throw new Error(`Scene not found: ${sceneId}. Did you forget to call ensureSceneLoaded?`);
    }
    if (this.currentSceneId && this.currentSceneId !== sceneId) {
      this.history.push(this.currentSceneId);
    }
    this.currentSceneId = sceneId;
    // 如果场景属于不同章节，切换
    if (this.chapterData && entry.chapter.chapter !== this.chapterData.chapter) {
      this.chapterData = entry.chapter;
    }
    return entry.scene;
  }

  setInitialScene(sceneId: string): void {
    this.currentSceneId = sceneId;
  }

  reset(): void {
    this.chapters.clear();
    this.currentSceneId = '';
    this.chapterData = null;
    this.sceneIndex.clear();
    this.history = [];
  }

  setHistory(history: string[]): void {
    this.history = [...history];
  }

  getHistory(): readonly string[] {
    return this.history;
  }

  getLoadedChapters(): Chapter[] {
    return Array.from(this.chapters.values());
  }

  async loadAllChapters(): Promise<Chapter[]> {
    const keys = Object.keys(chapterModules).sort((a, b) => {
      const ma = a.match(/ch(\d+)\.json$/);
      const mb = b.match(/ch(\d+)\.json$/);
      const na = ma ? parseInt(ma[1]) : 999;
      const nb = mb ? parseInt(mb[1]) : 999;
      return na - nb;
    });
    for (const key of keys) {
      const match = key.match(/ch(\d+)\.json$/);
      if (!match) continue;
      const chapterNum = parseInt(match[1]);
      if (this.chapters.has(chapterNum)) continue;
      const mod = await chapterModules[key]();
      const chapter: Chapter = (mod as unknown as { default?: Chapter }).default ?? (mod as unknown as Chapter);
      this.chapters.set(chapterNum, chapter);
      this.buildIndex(chapter);
    }
    return this.getLoadedChapters();
  }

  isSceneVisited(sceneId: string): boolean {
    return this.history.includes(sceneId);
  }

  /** 预加载下一章（后台加载，不阻塞当前渲染） */
  preloadNextChapter(currentChapterNum: number): void {
    const nextChapterNum = currentChapterNum + 1;
    if (this.chapters.has(nextChapterNum)) return; // 已加载
    const key = Object.keys(chapterModules).find(k => {
      const match = k.match(/ch(\d+)\.json$/);
      return match && parseInt(match[1]) === nextChapterNum;
    });
    if (!key) return; // 没有下一章了
    // 使用 setTimeout 延迟加载，不阻塞当前渲染
    setTimeout(async () => {
      try {
        const mod = await chapterModules[key]();
        const chapter: Chapter = (mod as unknown as { default?: Chapter }).default ?? (mod as unknown as Chapter);
        this.chapters.set(nextChapterNum, chapter);
        this.buildIndex(chapter);
      } catch { /* 静默失败，场景切换时会重试 */ }
    }, 0);
  }

  /** 获取某章的场景数量 */
  getChapterSceneCount(chapterNum: number): number {
    const ch = this.chapters.get(chapterNum);
    if (!ch) return 0;
    return ch.scenes.length;
  }

  private buildIndex(chapter: Chapter): void {
    for (const scene of chapter.scenes) {
      this.sceneIndex.set(scene.id, { chapter, scene });
    }
  }
}
