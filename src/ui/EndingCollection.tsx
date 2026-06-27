import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Chapter, Scene } from '../types/scene';

interface EndingEntry {
  title: string;
  text: string;
  sceneId: string;
  chapter: number;
  chapterTitle: string;
  unlocked: boolean;
}

interface EndingCollectionProps {
  onClose: () => void;
}

export function EndingCollection({ onClose }: EndingCollectionProps) {
  const { _sceneMgr, _saveMgr } = useGameStore();
  const [endings, setEndings] = useState<EndingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const unlockedSet = new Set<string>(_saveMgr.getUnlockedEndings());

        const chapters: Chapter[] = [];
        const chapterModules = import.meta.glob<Chapter>('../data/chapters/ch*.json', { eager: false });
        const keys = Object.keys(chapterModules).sort((a, b) => {
          const ma = a.match(/ch(\d+)\.json$/);
          const mb = b.match(/ch(\d+)\.json$/);
          return (ma ? parseInt(ma[1]) : 999) - (mb ? parseInt(mb[1]) : 999);
        });

        const endingScenes: { scene: Scene; chapter: Chapter }[] = [];

        for (const key of keys) {
          const mod = await chapterModules[key]();
          const ch: Chapter = (mod as unknown as { default?: Chapter }).default ?? (mod as unknown as Chapter);
          chapters.push(ch);
          for (const scene of ch.scenes) {
            if (scene.ending) {
              endingScenes.push({ scene, chapter: ch });
            }
          }
        }

        const entries: EndingEntry[] = endingScenes.map(({ scene, chapter: ch }) => ({
          title: scene.ending!.title,
          text: scene.ending!.text,
          sceneId: scene.id,
          chapter: ch.chapter,
          chapterTitle: ch.title,
          unlocked: unlockedSet.has(scene.id),
        }));

        if (!cancelled) setEndings(entries);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [_sceneMgr, _saveMgr]);

  const unlockedCount = useMemo(() => endings.filter(e => e.unlocked).length, [endings]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="endings-title"
      style={{
        background: 'linear-gradient(135deg, #1a1208 0%, #0d0a05 100%)',
      }}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-6 py-4 z-20"
        style={{
          background: 'linear-gradient(to bottom, rgba(26,18,8,0.98), rgba(26,18,8,0.9))',
          borderBottom: '1px solid rgba(180,130,60,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 id="endings-title" style={{ color: '#e8d5a3', fontFamily: 'serif', fontSize: '18px', letterSpacing: '0.2em', fontWeight: 'bold' }}>
            ◈ 终 点 ◈
          </h2>
          <p className="text-xs mt-1" style={{ color: '#a08860', fontFamily: 'serif' }}>
            已发现 {unlockedCount}/{endings.length} 个结局
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1 text-sm"
          style={{ color: '#c4a87c', border: '1px solid #8b6f47', background: 'rgba(26,18,8,0.6)', fontFamily: 'serif' }}
        >
          收起 ×
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-6 py-8"
        onClick={e => e.stopPropagation()}
        style={{
          fontFamily: 'serif',
          background: `
            radial-gradient(ellipse at 50% 20%, rgba(180,140,60,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 80%, rgba(180,140,60,0.03) 0%, transparent 50%),
            linear-gradient(180deg, #1a1208 0%, #0d0a05 100%)
          `,
        }}
      >
        {loading && (
          <div className="flex items-center justify-center h-full" style={{ color: '#a08860' }}>
            <p>正在翻阅命运的终点……</p>
          </div>
        )}

        {!loading && endings.length === 0 && (
          <div className="flex items-center justify-center h-full" style={{ color: '#a08860' }}>
            <p className="text-center italic">"每个人的终点都一样，只是到达的方式不同。"</p>
          </div>
        )}

        {!loading && (
          <div className="max-w-2xl mx-auto grid gap-6 sm:grid-cols-2">
            {endings.map((ending) => (
              <div
                key={ending.sceneId}
                className="p-6 transition-all duration-300"
                style={{
                  background: ending.unlocked
                    ? 'linear-gradient(135deg, rgba(60,40,20,0.5), rgba(40,25,10,0.5))'
                    : 'linear-gradient(135deg, rgba(30,20,10,0.4), rgba(20,12,6,0.4))',
                  border: ending.unlocked
                    ? '1px solid rgba(180,140,60,0.45)'
                    : '1px solid rgba(100,80,50,0.2)',
                  opacity: ending.unlocked ? 1 : 0.55,
                }}
              >
                <div className="mb-3">
                  {ending.unlocked ? (
                    <div
                      className="text-lg font-bold mb-1"
                      style={{ color: '#e8d5a3', letterSpacing: '0.1em' }}
                    >
                      {ending.title}
                    </div>
                  ) : (
                    <div
                      className="text-lg font-bold mb-1"
                      style={{ color: '#6a5030', letterSpacing: '0.15em' }}
                    >
                      ???
                    </div>
                  )}
                  <div className="text-xs" style={{ color: '#8b6f47', opacity: 0.7 }}>
                    第{['一','二','三','四','五','六','七','八','九','十'][ending.chapter - 1] || ending.chapter}章 · {ending.chapterTitle}
                  </div>
                </div>

                {ending.unlocked ? (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#c4a87c', fontStyle: 'italic' }}
                  >
                    {ending.text.length > 120 ? ending.text.slice(0, 120) + '……' : ending.text}
                  </p>
                ) : (
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{ color: '#5a4020' }}
                  >
                    命运的另一条路尚未被探索。或许在某个岔路口，你的选择会让你抵达此处。
                  </p>
                )}

                {/* 装饰元素 */}
                <div className="mt-4 flex justify-end">
                  <span
                    style={{
                      color: ending.unlocked ? '#b49450' : '#4a3020',
                      fontSize: '12px',
                      opacity: ending.unlocked ? 0.8 : 0.4,
                    }}
                  >
                    {ending.unlocked ? '✦ 已抵达' : '◇ 未抵达'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="px-6 py-2 text-center"
        style={{
          color: '#6a5030',
          background: 'linear-gradient(to top, rgba(13,10,5,0.95), rgba(26,18,8,0.7))',
          borderTop: '1px solid rgba(180,130,60,0.15)',
          fontSize: '11px',
          fontFamily: 'serif',
          letterSpacing: '0.1em',
        }}
      >
        Esc 关闭
      </div>
    </div>
  );
}
