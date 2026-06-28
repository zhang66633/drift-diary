import { useState, useEffect, useCallback } from 'react';

/** 首次访问时显示的诗意音频激活提示——点击任意位置即消失并响起 BGM */
export function AudioHint() {
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('audio_hint_dismissed');
    }
    return false;
  });
  const [fading, setFading] = useState(false);

  const dismiss = useCallback((e?: React.MouseEvent | React.PointerEvent) => {
    if (fading) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFading(true);
    try { sessionStorage.setItem('audio_hint_dismissed', '1'); } catch {}
    setTimeout(() => setVisible(false), 400);
  }, [fading]);

  useEffect(() => {
    if (!visible) return;
    const handlePointer = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dismiss();
    };
    window.addEventListener('pointerdown', handlePointer);
    return () => window.removeEventListener('pointerdown', handlePointer);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(26,16,8,0.7) 0%, rgba(13,10,5,0.92) 100%)',
        backdropFilter: 'blur(4px)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
      }}
      onPointerDown={dismiss}
    >
      <div className="text-center px-8">
        <div className="mb-8" style={{ opacity: 0.6 }}>
          <span
            className="inline-block text-4xl animate-bounce"
            style={{ animationDuration: '2s' }}
          >
            ⛵
          </span>
        </div>
        <p
          className="text-xl sm:text-2xl mb-4"
          style={{
            color: '#e8d5a3',
            fontFamily: 'serif',
            letterSpacing: '0.15em',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          触碰海风，翻开故事
        </p>
        <p
          className="text-sm animate-pulse"
          style={{ color: '#a08860', fontFamily: 'serif', opacity: 0.7 }}
        >
          点击任意位置开始
        </p>
      </div>
    </div>
  );
}
