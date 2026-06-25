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
      className="fixed inset-0 z-40 flex items-center justify-center p-8"
      style={{ background: 'rgba(42, 31, 20, 0.7)' }}
      onClick={onDismiss}
    >
      <div
        className="max-w-xl w-full p-8"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f4ecd8',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
          border: '1px solid #7a5a30',
        }}
      >
        <p
          className="italic text-lg leading-relaxed"
          style={{ color: '#5a4635', textIndent: '2em', whiteSpace: 'pre-line' }}
        >
          {text}
        </p>
        <p
          className="text-right mt-6 text-sm cursor-pointer select-none"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={onDismiss}
        >
          （继续 ▸）
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
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background: 'rgba(20, 10, 5, 0.85)' }}
      onClick={onDismiss}
    >
      <div
        className="max-w-xl w-full p-8"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'transparent',
        }}
      >
        <p
          className="italic text-lg leading-relaxed text-center"
          style={{ color: '#9a8a7a', textIndent: 0, opacity: 0.9, whiteSpace: 'pre-line' }}
        >
          <span className="text-sm" style={{ color: '#7a5a30', textIndent: 0 }}>— 梦 —</span>
          <br />
          <br />
          {dreamText}
        </p>
        <p
          className="text-center mt-8 text-sm cursor-pointer select-none italic"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={onDismiss}
        >
          （醒来 ▸）
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
      style={{ background: 'rgba(10, 5, 0, 0.92)' }}
      onClick={onDismiss}
    >
      <div
        className="max-w-lg w-full p-8 text-center"
        onClick={e => e.stopPropagation()}
      >
        <p
          className="italic text-lg leading-relaxed"
          style={{ color: '#8a7a6a', textIndent: 0 }}
        >
          {death.text}
        </p>
        <p
          className="text-center mt-10 text-sm cursor-pointer select-none"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={onDismiss}
        >
          （翻回之前的一页 ▸）
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
      style={{ background: '#f4ecd8' }}
      onClick={onDismiss}
    >
      <div className="max-w-xl w-full text-center" onClick={e => e.stopPropagation()}>
        <p className="text-sm mb-4" style={{ color: '#7a5a30', textIndent: 0 }}>
          第 {chapter} 章
        </p>
        <h2
          className="text-3xl font-semibold mb-8"
          style={{ color: '#1a1008', letterSpacing: '0.25em', textIndent: 0 }}
        >
          {title}
        </h2>
        <div
          className="border-t border-b py-5 my-6 mx-auto max-w-md italic"
          style={{ borderColor: '#7a5a30', color: '#5a4220' }}
        >
          "{quotation}"
        </div>
        <p
          className="mt-12 text-sm cursor-pointer select-none"
          style={{ color: '#7a5a30', textIndent: 0 }}
          onClick={onDismiss}
        >
          （翻开此章 ▸）
        </p>
      </div>
    </div>
  );
}

interface EndingOverlayProps {
  ending: EndingSpec | null;
  onDismiss: () => void;
}

export function EndingOverlay({ ending, onDismiss }: EndingOverlayProps) {
  if (!ending) return null;
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'rgba(8, 4, 0, 0.95)' }}
      onClick={onDismiss}
    >
      <div
        className="flex items-center justify-center min-h-full p-8"
      >
        <div
          className="max-w-xl w-full py-8 text-center flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <p className="text-sm mb-4 tracking-widest" style={{ color: '#7a6a5a', textIndent: 0 }}>
            — 结局 —
          </p>
          <h2
            className="text-3xl font-semibold mb-8"
            style={{ color: '#c8b898', letterSpacing: '0.3em', textIndent: 0 }}
          >
            {ending.title}
          </h2>
          <div
            className="border-t border-b py-6 mb-8 mx-auto max-w-md"
            style={{ borderColor: '#4a3a2a' }}
          >
            <p
              className="italic leading-loose"
              style={{ color: '#a89a8a', textIndent: '2em', whiteSpace: 'pre-line', textAlign: 'justify' }}
            >
              {ending.text}
            </p>
          </div>
          <button
            className="px-8 py-3 text-base cursor-pointer select-none transition-all duration-200"
            style={{
              color: '#d4c4a8',
              background: 'transparent',
              border: '1px solid #8a7a5a',
              letterSpacing: '0.15em',
              textIndent: 0,
            }}
            onClick={onDismiss}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.borderColor = '#c4a87c';
              btn.style.color = '#f0e4c8';
              btn.style.boxShadow = '0 0 20px rgba(196, 168, 124, 0.2)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.borderColor = '#8a7a5a';
              btn.style.color = '#d4c4a8';
              btn.style.boxShadow = 'none';
            }}
          >
            {ending.buttonText || '合上书本'}
          </button>
          <p
            className="mt-3 text-xs select-none"
            style={{ color: '#5a4a3a', textIndent: 0 }}
          >
            （点击任意处关闭）
          </p>
        </div>
      </div>
    </div>
  );
}
