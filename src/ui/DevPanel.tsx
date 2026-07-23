import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Chapter } from '../types/scene';

const CHAPTER_TITLES: Record<number, string> = {
  1: '第一章 · 出走与初航',
  2: '第二章 · 奴役与逃亡',
  3: '第三章 · 孤岛第一夜',
};

const PRESETS = [
  { id: 'medium', label: '通用中等', desc: '健康80/士气55/物资平均' },
  { id: 'ch2_medium', label: '第二章中等', desc: '基装物资/钱50/航海2' },
  { id: 'ch3_medium', label: '第三章中等', desc: '全套物资/圣经/围栅/在岛' },
] as const;

export function DevPanel() {
  const { isDebug, jumpToScene, applyPreset } = useGameStore(s => ({
    isDebug: s.isDebugMode,
    jumpToScene: s.jumpToScene,
    applyPreset: s.applyPreset,
  }));

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(0);
  const [selectedScene, setSelectedScene] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isDebug) return;
    const sceneMgr = useGameStore.getState()._sceneMgr;
    sceneMgr.loadAllChapters().then(ch => {
      setChapters(ch.sort((a, b) => a.chapter - b.chapter));
      if (ch.length > 0 && selectedChapter === 0) {
        setSelectedChapter(ch[0].chapter);
      }
    });
  }, [isDebug]);

  const currentChapterScenes = useMemo(() => {
    const ch = chapters.find(c => c.chapter === selectedChapter);
    return ch?.scenes ?? [];
  }, [chapters, selectedChapter]);

  useEffect(() => {
    if (currentChapterScenes.length > 0 && !selectedScene) {
      setSelectedScene(currentChapterScenes[0].id);
    }
  }, [currentChapterScenes, selectedScene]);

  if (!isDebug) return null;

  const handleJump = async () => {
    if (!selectedScene) return;
    setLoading(true);
    try {
      await jumpToScene(selectedScene);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (presetId: typeof PRESETS[number]['id']) => {
    applyPreset(presetId);
  };

  return (
    <div
      className="max-w-3xl mx-auto mt-1 pt-1 border-t"
      style={{ borderColor: 'rgba(122, 90, 48, 0.2)' }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className="px-2 py-0.5 text-[0.65rem] font-bold"
          style={{ background: '#5a4220', color: '#f4ecd8', borderRadius: '2px' }}
        >
          DEV
        </span>
        <span className="text-[0.65rem]" style={{ color: '#7a5a30' }}>
          Ctrl+Shift+D 切换调试模式
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <label className="text-[0.7rem]" style={{ color: '#5a4635' }}>
          章节：
          <select
            value={selectedChapter}
            onChange={e => {
              setSelectedChapter(Number(e.target.value));
              setSelectedScene('');
            }}
            className="ml-1 px-2 py-0.5 text-[0.7rem]"
            style={{
              background: '#f4ecd8',
              border: '1px solid #c4a87c',
              color: '#3a2a15',
              borderRadius: '2px',
            }}
          >
            {chapters.map(ch => (
              <option key={ch.chapter} value={ch.chapter}>
                {CHAPTER_TITLES[ch.chapter] || `第${ch.chapter}章`} ({ch.scenes.length}场景)
              </option>
            ))}
          </select>
        </label>

        <label className="text-[0.7rem]" style={{ color: '#5a4635' }}>
          场景：
          <select
            value={selectedScene}
            onChange={e => setSelectedScene(e.target.value)}
            className="ml-1 px-2 py-0.5 text-[0.7rem] max-w-[280px]"
            style={{
              background: '#f4ecd8',
              border: '1px solid #c4a87c',
              color: '#3a2a15',
              borderRadius: '2px',
            }}
          >
            {currentChapterScenes.map(scene => (
              <option key={scene.id} value={scene.id}>
                {scene.beat || scene.id}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={handleJump}
          disabled={loading || !selectedScene}
          className="px-3 py-0.5 text-[0.7rem]"
          style={{
            background: loading ? '#a08060' : '#7a5a30',
            color: '#f4ecd8',
            border: 'none',
            borderRadius: '2px',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? '跳转中…' : '跳转'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[0.7rem]" style={{ color: '#5a4635' }}>数值预设：</span>
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => handlePreset(p.id)}
            className="px-2 py-0.5 text-[0.65rem]"
            style={{
              background: 'rgba(90, 66, 32, 0.08)',
              color: '#5a4220',
              border: '1px solid rgba(122, 90, 48, 0.3)',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
            title={p.desc}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
