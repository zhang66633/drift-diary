import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Chapter } from '../types/scene';
import type { SceneSnapshot } from '../types/state';

interface MemoirProps {
  onClose: () => void;
  standalone?: boolean;
}

interface MemoirData {
  chapters: Chapter[];
  history: string[];
  currentId: string;
  snapshots: SceneSnapshot[];
}

interface TimelineEntry {
  sceneId: string;
  chapter: number;
  beat: string;
  title?: string;
  date?: string;
  choiceText?: string;
  isCurrent: boolean;
  snapshot?: SceneSnapshot;
}

interface TimelineChapter {
  chapter: number;
  title: string;
  entries: TimelineEntry[];
}

const chNumLabel = (n: number) => ['一','二','三','四','五','六','七','八','九','十'][n - 1] || String(n);

export function Memoir({ onClose, standalone = false }: MemoirProps) {
  const { _sceneMgr, _saveMgr, getMemoirData } = useGameStore();
  const [data, setData] = useState<MemoirData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailSnap, setDetailSnap] = useState<SceneSnapshot | null>(null);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const chapterRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        if (standalone) {
          const latest = _saveMgr.getLatestSave();
          if (latest) {
            const chapterMatch = latest.gameState.currentSceneId.match(/^ch(\d+)_/);
            const maxChapter = chapterMatch ? parseInt(chapterMatch[1]) : 2;
            const chapters: Chapter[] = [];
            const chapterModules = import.meta.glob<Chapter>('../data/chapters/ch*.json', { eager: false });
            const keys = Object.keys(chapterModules).sort((a, b) => {
              const ma = a.match(/ch(\d+)\.json$/);
              const mb = b.match(/ch(\d+)\.json$/);
              return (ma ? parseInt(ma[1]) : 999) - (mb ? parseInt(mb[1]) : 999);
            });
            for (const key of keys) {
              const m = key.match(/ch(\d+)\.json$/);
              if (!m) continue;
              const chNum = parseInt(m[1]);
              if (chNum > maxChapter) continue;
              const mod = await chapterModules[key]();
              const ch: Chapter = (mod as unknown as { default?: Chapter }).default ?? (mod as unknown as Chapter);
              chapters.push(ch);
            }
            if (!cancelled) {
              setData({
                chapters,
                history: latest.gameState.history,
                currentId: latest.gameState.currentSceneId,
                snapshots: latest.gameState.historySnapshots,
              });
            }
          } else {
            if (!cancelled) setData(null);
          }
        } else {
          await _sceneMgr.loadAllChapters();
          if (!cancelled) {
            const m = getMemoirData();
            setData(m);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [standalone, _sceneMgr, _saveMgr, getMemoirData]);

  const timeline = useMemo<TimelineChapter[]>(() => {
    if (!data) return [];

    const snapMap = new Map<string, SceneSnapshot>();
    for (const s of data.snapshots) {
      snapMap.set(s.sceneId, s);
    }

    const chapterMap = new Map<number, Chapter>();
    for (const ch of data.chapters) {
      chapterMap.set(ch.chapter, ch);
    }

    const orderedIds: string[] = [...data.history];
    if (data.currentId && !orderedIds.includes(data.currentId)) {
      orderedIds.push(data.currentId);
    }

    const entriesByChapter = new Map<number, TimelineEntry[]>();

    for (const sceneId of orderedIds) {
      const snap = snapMap.get(sceneId);
      const chMatch = sceneId.match(/^ch(\d+)_/);
      const chapter = chMatch ? parseInt(chMatch[1]) : 0;
      const entry: TimelineEntry = {
        sceneId,
        chapter,
        beat: snap?.beat ?? sceneId,
        title: snap?.title,
        date: snap?.date,
        choiceText: snap?.choiceText,
        isCurrent: sceneId === data.currentId,
        snapshot: snap,
      };
      if (!entriesByChapter.has(chapter)) entriesByChapter.set(chapter, []);
      entriesByChapter.get(chapter)!.push(entry);
    }

    const result: TimelineChapter[] = [];
    const seenChapters = new Set<number>();

    for (const sceneId of orderedIds) {
      const chMatch = sceneId.match(/^ch(\d+)_/);
      const chapter = chMatch ? parseInt(chMatch[1]) : 0;
      if (seenChapters.has(chapter)) continue;
      seenChapters.add(chapter);
      const chData = chapterMap.get(chapter);
      result.push({
        chapter,
        title: chData?.title ?? `第${chNumLabel(chapter)}章`,
        entries: entriesByChapter.get(chapter) ?? [],
      });
    }

    return result;
  }, [data]);

  // 滚动时跟踪当前章节
  useEffect(() => {
    if (!data || timeline.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const chNum = parseInt(entry.target.getAttribute('data-chapter') || '0');
            if (chNum > 0) setActiveChapter(chNum);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    chapterRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data, timeline]);

  const scrollToChapter = (chNum: number) => {
    const el = chapterRefs.current.get(chNum);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailSnap) { setDetailSnap(null); return; }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, detailSnap]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="memoir-title"
      style={{
        background: 'linear-gradient(135deg, #2a1f10 0%, #1a1208 100%)',
      }}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-6 py-4 z-20"
        style={{
          background: 'linear-gradient(to bottom, rgba(42,31,16,0.98), rgba(42,31,16,0.9))',
          borderBottom: '1px solid rgba(139,90,26,0.4)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 id="memoir-title" style={{ color: '#e8d5a3', fontFamily: 'serif', fontSize: '18px', letterSpacing: '0.15em', fontWeight: 'bold' }}>
          ◈ 航 程 回 顾 ◈
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-1 text-sm"
          style={{ color: '#c4a87c', border: '1px solid #7a5a30', background: 'rgba(42,31,16,0.6)', fontFamily: 'serif' }}
        >
          收起 ×
        </button>
      </div>

      {/* 章节导航：移动端顶部 tab，桌面端侧栏 */}
      {!loading && data && timeline.length > 1 && (
        <>
          {/* 移动端横向 tab */}
          <div
            className="sm:hidden flex gap-1 px-4 py-2 overflow-x-auto"
            style={{ borderBottom: '1px solid rgba(139,90,26,0.3)', background: 'rgba(26,18,8,0.8)' }}
            onClick={e => e.stopPropagation()}
          >
            {timeline.map((ch) => (
              <button
                key={ch.chapter}
                onClick={() => scrollToChapter(ch.chapter)}
                className="px-3 py-1.5 text-xs whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  color: activeChapter === ch.chapter ? '#e8d5a3' : '#8b7355',
                  borderBottom: activeChapter === ch.chapter ? '2px solid #d4b87a' : '2px solid transparent',
                  fontFamily: 'serif',
                  letterSpacing: '0.1em',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                第{chNumLabel(ch.chapter)}章
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* 桌面端侧栏 */}
        {!loading && data && timeline.length > 1 && (
          <div
            className="hidden sm:block w-44 flex-shrink-0 overflow-y-auto py-8 px-4"
            style={{
              borderRight: '1px solid rgba(139,90,26,0.25)',
              background: 'rgba(26,18,8,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs mb-4 px-2" style={{ color: '#8b7355', letterSpacing: '0.2em', fontFamily: 'serif' }}>
              章 节
            </p>
            <div className="space-y-1">
              {timeline.map((ch) => (
                <button
                  key={ch.chapter}
                  onClick={() => scrollToChapter(ch.chapter)}
                  className="w-full text-left px-3 py-2 text-sm transition-all duration-200"
                  style={{
                    color: activeChapter === ch.chapter ? '#e8d5a3' : '#8b7355',
                    background: activeChapter === ch.chapter ? 'rgba(180,140,80,0.12)' : 'transparent',
                    borderLeft: activeChapter === ch.chapter ? '2px solid #d4b87a' : '2px solid transparent',
                    fontFamily: 'serif',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                  }}
                >
                  <div className="text-xs opacity-60">第{chNumLabel(ch.chapter)}章</div>
                  <div className="text-xs mt-0.5 truncate">{ch.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto px-6 py-8"
          onClick={e => e.stopPropagation()}
          style={{
            fontFamily: 'serif',
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(180,140,80,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(180,140,80,0.04) 0%, transparent 50%),
              linear-gradient(180deg, #3a2a15 0%, #33251080 50%, #2a1f10 100%)
            `,
          }}
        >
          {loading && (
            <div className="flex items-center justify-center h-full" style={{ color: '#c4a87c' }}>
              <p>正在展开回忆……</p>
            </div>
          )}

          {!loading && !data && (
            <div className="flex items-center justify-center h-full" style={{ color: '#c4a87c' }}>
              <p>尚无航程记录</p>
            </div>
          )}

          {!loading && data && (
            <div className="max-w-xl mx-auto">
              {timeline.map((ch) => (
                <div
                  key={ch.chapter}
                  data-chapter={ch.chapter}
                  ref={(el) => { if (el) chapterRefs.current.set(ch.chapter, el); }}
                  className="mb-10"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div style={{ width: '40px', height: '1px', background: '#c4a87c', opacity: 0.4 }} />
                    <h3 style={{ color: '#d4b87a', fontSize: '16px', letterSpacing: '0.25em', fontWeight: 'bold' }}>
                      第{chNumLabel(ch.chapter)}章 · {ch.title}
                    </h3>
                    <div style={{ flex: 1, height: '1px', background: '#c4a87c', opacity: 0.2 }} />
                  </div>

                <div>
                  {ch.entries.map((entry, i) => (
                    <div key={entry.sceneId} className="flex gap-4">
                      <div className="flex flex-col items-center pt-1.5" style={{ width: '28px', flexShrink: 0 }}>
                        {entry.isCurrent ? (
                          <span style={{ fontSize: '16px', lineHeight: 1 }}>⛵</span>
                        ) : i === 0 ? (
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c4a87c', opacity: 0.8 }} />
                        ) : (
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a08860', opacity: 0.6 }} />
                        )}
                        {i < ch.entries.length - 1 && (
                          <div style={{ width: '1px', flex: 1, background: '#8b7355', opacity: 0.35, marginTop: '6px', marginBottom: '-6px' }} />
                        )}
                      </div>

                      <div
                        className="flex-1 pb-4"
                        style={{ cursor: entry.snapshot ? 'pointer' : 'default' }}
                        onClick={() => { if (entry.snapshot) setDetailSnap(entry.snapshot); }}
                      >
                        <div className="flex items-baseline gap-3 flex-wrap">
                          {entry.date && (
                            <span style={{ color: '#a08860', fontSize: '11px', fontVariantNumeric: 'tabular-nums', flexShrink: 0, opacity: 0.8 }}>
                              {entry.date}
                            </span>
                          )}
                          <span
                            style={{
                              color: entry.isCurrent ? '#f8edd0' : '#e8d5a8',
                              fontSize: entry.isCurrent ? '16px' : '14px',
                              fontWeight: entry.isCurrent ? 'bold' : 'normal',
                            }}
                          >
                            {entry.beat}
                          </span>
                          {entry.isCurrent && (
                            <span style={{ color: '#c4a87c', fontSize: '10px', opacity: 0.7 }}>[当前]</span>
                          )}
                        </div>
                        {entry.choiceText && i > 0 && (
                          <p style={{ color: '#9a8060', fontSize: '11px', marginTop: '3px', fontStyle: 'italic', opacity: 0.7 }}>
                            → 「{entry.choiceText}」
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="text-center mt-4 pb-4">
              <p style={{ color: '#7a6040', fontSize: '12px', opacity: 0.5, letterSpacing: '0.15em' }}>
                — 航程未完待续 —
              </p>
            </div>
          </div>
        )}
        </div>
      </div>

      <div
        className="px-6 py-2 text-center"
        style={{
          color: '#8b7355',
          background: 'linear-gradient(to top, rgba(26,18,8,0.95), rgba(42,31,16,0.7))',
          borderTop: '1px solid rgba(139,90,26,0.25)',
          fontSize: '11px',
          fontFamily: 'serif',
          letterSpacing: '0.1em',
        }}
      >
        点击条目可回看原文 · 点击侧栏跳转章节 · Esc 关闭
      </div>

      {detailSnap && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center p-8"
          style={{ background: 'rgba(42,31,16,0.85)' }}
          onClick={() => setDetailSnap(null)}
        >
          <div
            className="max-w-2xl w-full max-h-[70vh] overflow-y-auto p-8"
            style={{
              background: '#f4ecd8',
              border: '2px solid #7a5a30',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#3a2a15', fontFamily: 'serif' }}>
                  {detailSnap.title || detailSnap.beat}
                </h3>
                {detailSnap.date && (
                  <p className="text-sm mt-1" style={{ color: '#8b6f47', fontFamily: 'serif' }}>
                    {detailSnap.date}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDetailSnap(null)}
                className="text-sm"
                style={{ color: '#7a5a30' }}
              >
                ×
              </button>
            </div>
            <div className="space-y-3" style={{ color: '#3a2a15', fontFamily: 'serif', lineHeight: 1.9 }}>
              {detailSnap.text.map((p, i) => (
                <p key={i} style={{ textIndent: '2em' }}>{p}</p>
              ))}
            </div>
            {detailSnap.choiceText && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px dashed #c4a87c' }}>
                <p className="text-sm italic" style={{ color: '#7a5a30' }}>
                  你选择了：「{detailSnap.choiceText}」
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
