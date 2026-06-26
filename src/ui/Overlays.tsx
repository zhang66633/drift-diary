import { useState, useEffect, useRef } from 'react';
import type { NarrationSpec, DreamSpec, DeathSpec, EndingSpec } from '../types/scene';

// 将文本按段落拆分成多页
function splitIntoPages(text: string, charsPerPage = 400): string[] {
  // 按换行分割段落
  const paragraphs = text.split('\n').filter(p => p.trim());
  const pages: string[] = [];
  let currentPage = '';
  let currentLength = 0;

  for (const para of paragraphs) {
    if (currentLength + para.length > charsPerPage && currentPage) {
      pages.push(currentPage.trim());
      currentPage = para;
      currentLength = para.length;
    } else {
      currentPage += '\n' + para;
      currentLength += para.length;
    }
  }
  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  // 如果只有一页但太长，再按字符截断
  if (pages.length === 1 && pages[0].length > charsPerPage * 1.5) {
    const words = text.split('');
    pages.length = 0;
    currentPage = '';
    for (const char of words) {
      currentPage += char;
      if (currentPage.length >= charsPerPage) {
        pages.push(currentPage);
        currentPage = '';
      }
    }
    if (currentPage) pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [text];
}

interface NarrationOverlayProps {
  narration: NarrationSpec | null;
  text: string;
  onDismiss: () => void;
}

export function NarrationOverlay({ text, onDismiss }: NarrationOverlayProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const pages = splitIntoPages(text);

  // text 变化时重置 pageIndex
  useEffect(() => {
    setPageIndex(0);
  }, [text]);

  useEffect(() => {
    // 组件挂载时触发动画
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleNext = () => {
    if (isTransitioning) return;
    if (pageIndex < pages.length - 1) {
      setIsTransitioning(true);
      setIsVisible(false);
      timerRef.current = window.setTimeout(() => {
        setPageIndex(i => i + 1);
        setIsVisible(true);
        setIsTransitioning(false);
      }, 250);
    } else {
      // 最后一页，关闭
      setIsVisible(false);
      timerRef.current = window.setTimeout(onDismiss, 300);
    }
  };

  const handleBack = () => {
    if (pageIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setIsVisible(false);
      timerRef.current = window.setTimeout(() => {
        setPageIndex(i => i - 1);
        setIsVisible(true);
        setIsTransitioning(false);
      }, 250);
    }
  };

  // 键盘支持：左键返回，Space/右键/Enter前进
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleBack();
      else if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pageIndex, isTransitioning]);

  if (!text) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8"
      style={{
        background: 'rgba(42, 31, 20, 0.7)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={handleNext}
    >
      <div
        className="max-w-xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f4ecd8',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
          border: '1px solid #7a5a30',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <p
          className="italic text-base sm:text-lg leading-relaxed"
          style={{ color: '#5a4635', textIndent: '2em', whiteSpace: 'pre-line' }}
        >
          {pages[pageIndex]}
        </p>

        {/* 分页指示 */}
        {pages.length > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-xs" style={{ color: '#a09080', textIndent: 0 }}>
              {pageIndex + 1} / {pages.length}
            </span>
            <div
              className="flex gap-1"
              style={{ textIndent: 0 }}
            >
              {pages.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: i === pageIndex ? '#7a5a30' : '#c0b0a0',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
            <span
              className="text-sm cursor-pointer select-none"
              style={{ color: '#7a5a30', textIndent: 0 }}
              onClick={handleNext}
            >
              {pageIndex < pages.length - 1 ? '▸ 继续' : '（关闭）'}
            </span>
          </div>
        )}

        {/* 只有一页时的关闭提示 */}
        {pages.length === 1 && (
          <p
            className="text-right mt-6 text-sm cursor-pointer select-none"
            style={{ color: '#7a5a30', textIndent: 0 }}
            onClick={handleNext}
          >
            （继续 ▸）
          </p>
        )}
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  if (!dream) return null;
  const dreamText = resolvedDreamText ?? (typeof dream.text === 'string' ? dream.text : '');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      style={{
        background: 'rgba(20, 10, 5, 0.85)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
      onClick={onDismiss}
    >
      <div
        className="max-w-xl w-full max-h-[80vh] overflow-y-auto p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'transparent',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s ease, transform 0.4s ease',
        }}
      >
        <p
          className="italic text-base sm:text-lg leading-relaxed text-center"
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

  // Insert resolved lionText into the placeholder position
  const lionPlaceholder = '想起那头没敢打的狮子';
  const resolvedText = typeof ending.lionText === 'string' && ending.lionText
    ? ending.text.replace(lionPlaceholder, ending.lionText)
    : ending.text;

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
              {resolvedText}
            </p>
            {ending.moneyText && (
              <p
                className="italic leading-loose mt-4"
                style={{ color: '#a89a8a', textIndent: '2em', whiteSpace: 'pre-line', textAlign: 'justify' }}
              >
                {ending.moneyText as string}
              </p>
            )}
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
