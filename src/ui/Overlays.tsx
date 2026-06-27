import { useState, useEffect } from 'react';
import type { NarrationSpec, DreamSpec, DeathSpec, EndingSpec } from '../types/scene';

interface NarrationOverlayProps {
  narration: NarrationSpec | null;
  text: string;
  onDismiss: () => void;
}

export function NarrationOverlay({ text, onDismiss }: NarrationOverlayProps) {
  if (!text) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="旁白"
      style={{ background: 'rgba(42, 31, 20, 0.75)' }}
      onClick={onDismiss}
    >
      <div
        className="max-w-xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8 overlay-panel"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-4" style={{ color: '#7a5a30', opacity: 0.6, textIndent: 0 }}>
          <span className="text-sm tracking-widest">— 旁 白 —</span>
        </div>
        <p
          className="italic text-base sm:text-lg leading-relaxed"
          style={{ color: '#5a4635', textIndent: '2em', whiteSpace: 'pre-line', lineHeight: 2 }}
        >
          {text}
        </p>
        <p
          className="text-right mt-8 text-sm cursor-pointer select-none transition-opacity hover:opacity-70"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={onDismiss}
        >
          继续阅读 ▸
        </p>
      </div>
    </div>
  );
}

interface DreamOverlayProps {
  dream: DreamSpec | null;
  resolvedDreamText?: string;
  onDismiss: () => void;
}

export function DreamOverlay({ dream, resolvedDreamText, onDismiss }: DreamOverlayProps) {
  if (!dream) return null;
  const dreamText = resolvedDreamText ?? (typeof dream.text === 'string' ? dream.text : '');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="梦境"
      style={{
        background: 'rgba(15, 8, 3, 0.92)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onDismiss}
    >
      <div
        className="max-w-xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-10"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'transparent',
        }}
      >
        <div className="text-center mb-8" style={{ textIndent: 0 }}>
          <span
            className="text-sm tracking-[0.5em] italic"
            style={{ color: '#8a7a6a', opacity: 0.7 }}
          >
            — 梦 —
          </span>
        </div>
        <p
          className="italic text-base sm:text-lg leading-loose text-center"
          style={{
            color: '#a89a8a',
            textIndent: 0,
            whiteSpace: 'pre-line',
            textShadow: '0 0 20px rgba(180, 160, 120, 0.1)',
            lineHeight: 2.2,
          }}
        >
          {dreamText}
        </p>
        <p
          className="text-center mt-12 text-sm cursor-pointer select-none italic transition-opacity hover:opacity-70"
          style={{ color: '#7a6a5a', textIndent: 0 }}
          onClick={onDismiss}
        >
          从梦中醒来 ▸
        </p>
      </div>
    </div>
  );
}

interface DeathOverlayProps {
  death: DeathSpec | null;
  onDismiss: () => void;
}

export function DeathOverlay({ death, onDismiss }: DeathOverlayProps) {
  if (!death) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      role="dialog"
      aria-modal="true"
      aria-label="死亡结局"
      style={{ background: 'rgba(8, 4, 0, 0.95)' }}
      onClick={onDismiss}
    >
      <div
        className="max-w-lg w-full p-8 sm:p-12 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-8 text-center" style={{ textIndent: 0 }}>
          <span
            className="text-sm tracking-[0.5em]"
            style={{ color: '#6a5a4a', opacity: 0.6 }}
          >
            — 手 稿 中 断 —
          </span>
        </div>
        <p
          className="italic text-lg leading-relaxed"
          style={{ color: '#9a8a7a', textIndent: 0, lineHeight: 2 }}
        >
          {death.text}
        </p>
        <p
          className="text-center mt-12 text-sm cursor-pointer select-none transition-opacity hover:opacity-70"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={onDismiss}
        >
          翻回之前的一页 ▸
        </p>
      </div>
    </div>
  );
}

interface ChapterTitleOverlayProps {
  chapter: number;
  title: string;
  quotation: string;
  visible: boolean;
  onDismiss: () => void;
}

export function ChapterTitleOverlay({ chapter, title, quotation, visible, onDismiss }: ChapterTitleOverlayProps) {
  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`第${chapter}章 ${title}`}
      style={{
        background: '#f4ecd8',
        backgroundImage: `
          radial-gradient(ellipse at 30% 20%, rgba(255, 240, 200, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(180, 140, 80, 0.12) 0%, transparent 50%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.65 0 0 0 0 0.55 0 0 0 0 0.40 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")
        `,
      }}
      onClick={onDismiss}
    >
      <div
        className="max-w-xl w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-6 flex justify-center gap-3" style={{ color: '#7a5a30', opacity: 0.5 }}>
          <span>❦</span>
          <span>❧</span>
          <span>❦</span>
        </div>

        <p
          className="text-sm mb-4 tracking-[0.3em]"
          style={{ color: '#7a5a30', textIndent: 0 }}
        >
          第 {chapter} 章
        </p>

        <h2
          className="text-3xl sm:text-4xl font-semibold mb-10"
          style={{
            color: '#1a1008',
            letterSpacing: '0.3em',
            textIndent: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          {title}
        </h2>

        <div className="mx-auto max-w-md px-8 py-6" style={{
          borderTop: '1px solid rgba(122, 90, 48, 0.35)',
          borderBottom: '1px solid rgba(122, 90, 48, 0.35)',
        }}>
          <p className="italic text-center leading-relaxed" style={{ color: '#5a4220', textIndent: 0 }}>
            "{quotation}"
          </p>
        </div>

        <p
          className="mt-12 text-sm cursor-pointer select-none transition-opacity hover:opacity-70"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={onDismiss}
        >
          翻开此章 ▸
        </p>
      </div>
    </div>
  );
}

interface EndingOverlayProps {
  ending: EndingSpec | null;
  illustrationSrc?: string | null;
  onDismiss: () => void;
}

export function EndingOverlay({ ending, illustrationSrc, onDismiss }: EndingOverlayProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setImgLoaded(false);
    setShowContent(false);
  }, [ending]);

  const handleImageLoad = () => {
    setImgLoaded(true);
  };

  const handleReveal = () => {
    setShowContent(true);
  };

  if (!ending) return null;

  const lionPlaceholder = '想起那头没敢打的狮子';
  const resolvedText = typeof ending.lionText === 'string' && ending.lionText
    ? ending.text.replace(lionPlaceholder, ending.lionText)
    : ending.text;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={ending.title || '结局'}
      style={{ background: 'linear-gradient(180deg, #e8dcc0 0%, #f4ecd8 100%)' }}
      onClick={handleReveal}
    >
      {/* 图片层 - 始终显示 */}
      {illustrationSrc && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={illustrationSrc}
            alt=""
            onLoad={handleImageLoad}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imgLoaded ? 0.6 : 0,
              filter: 'brightness(0.9) saturate(0.85)',
              transition: 'opacity 0.6s ease-out',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(244,236,216,0.15) 0%, rgba(244,236,216,0.5) 40%, rgba(244,236,216,0.85) 100%)',
            }}
          />
        </div>
      )}

      {/* 点击提示 - 图片加载后显示，内容未显示时可见 */}
      {!showContent && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease-out',
            pointerEvents: 'none',
          }}
        >
          <div className="text-center" style={{ pointerEvents: 'auto' }}>
            <div
              className="text-base cursor-pointer select-none animate-pulse"
              style={{ color: '#6a5a4a', textIndent: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                handleReveal();
              }}
            >
              <span className="inline-block mr-2">✦</span>
              点击继续
              <span className="inline-block ml-2">✦</span>
            </div>
          </div>
        </div>
      )}

      {/* 文字内容 - 点击后显示 */}
      <div
        className="flex items-center justify-center min-h-full p-8 relative z-10"
        style={{
          opacity: showContent ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
          pointerEvents: showContent ? 'auto' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="max-w-xl w-full py-8 text-center flex-shrink-0"
        >
          <div className="mb-6 flex justify-center gap-3" style={{ color: '#8a7050', opacity: 0.6 }}>
            <span>✦</span>
            <span>✧</span>
            <span>✦</span>
          </div>

          <p
            className="text-sm mb-4 tracking-[0.4em]"
            style={{ color: '#8a7050', textIndent: 0 }}
          >
            — 结 局 —
          </p>

          <h2
            className="text-3xl sm:text-4xl font-semibold mb-10"
            style={{
              color: '#3a2815',
              letterSpacing: '0.35em',
              textIndent: 0,
              textShadow: '0 2px 10px rgba(255, 240, 200, 0.5)',
            }}
          >
            {ending.title}
          </h2>

          <div className="relative mx-auto max-w-md">
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #a08050, transparent)' }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #a08050, transparent)' }}
            />
            <div className="py-8 px-4">
              <p
                className="italic leading-loose"
                style={{
                  color: '#4a3825',
                  textIndent: '2em',
                  whiteSpace: 'pre-line',
                  textAlign: 'justify',
                  lineHeight: 2.2,
                }}
              >
                {resolvedText}
              </p>
              {ending.moneyText && (
                <p
                  className="italic leading-loose mt-6"
                  style={{
                    color: '#4a3825',
                    textIndent: '2em',
                    whiteSpace: 'pre-line',
                    textAlign: 'justify',
                    lineHeight: 2.2,
                  }}
                >
                  {ending.moneyText as string}
                </p>
              )}
            </div>
          </div>

          <button
            className="mt-8 px-10 py-3 text-base cursor-pointer select-none transition-all duration-300"
            style={{
              color: '#5a4020',
              background: 'rgba(244, 236, 216, 0.5)',
              border: '1px solid #a08050',
              letterSpacing: '0.2em',
              textIndent: 0,
              fontFamily: 'inherit',
            }}
            onClick={onDismiss}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.borderColor = '#8a6030';
              btn.style.color = '#3a2815';
              btn.style.boxShadow = '0 0 20px rgba(160, 128, 80, 0.3)';
              btn.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.borderColor = '#a08050';
              btn.style.color = '#5a4020';
              btn.style.boxShadow = 'none';
              btn.style.transform = 'translateY(0)';
            }}
          >
            {ending.buttonText || '合上书本'}
          </button>

          <p
            className="mt-4 text-xs select-none"
            style={{ color: '#6a5a4a', textIndent: 0, opacity: 0.7 }}
          >
            点击任意处关闭
          </p>
        </div>
      </div>
    </div>
  );
}
