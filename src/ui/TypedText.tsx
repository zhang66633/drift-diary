import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettings } from '../store/settingsStore';

interface TypedTextProps {
  paragraphs: string[];
  onComplete: () => void;
}

export function TypedText({ paragraphs, onComplete }: TypedTextProps) {
  const typingSpeedMs = useSettings(s => s.getTypingIntervalMs());
  const [finishedCount, setFinishedCount] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const currentParagraphIndex = finishedCount;
  const isAllDone = finishedCount >= paragraphs.length;
  const currentFullText = paragraphs[currentParagraphIndex] ?? '';
  const isCurrentTyping = !isAllDone && charIndex < currentFullText.length;

  // Ref to avoid stale closure in setInterval callback
  const currentFullTextRef = useRef(currentFullText);
  currentFullTextRef.current = currentFullText;

  const handleClick = useCallback(() => {
    if (isAllDone) return;

    if (typingSpeedMs === 0) {
      setFinishedCount(paragraphs.length);
      setCurrentText('');
      setCharIndex(0);
      onComplete();
      return;
    }

    if (charIndex < currentFullText.length) {
      setCurrentText(currentFullText);
      setCharIndex(currentFullText.length);
      clearTimer();
    } else if (finishedCount < paragraphs.length - 1) {
      setFinishedCount(f => f + 1);
      setCurrentText('');
      setCharIndex(0);
    } else {
      setFinishedCount(paragraphs.length);
      onComplete();
    }
  }, [isAllDone, currentParagraphIndex, paragraphs, charIndex, finishedCount, onComplete, clearTimer, typingSpeedMs, currentFullText]);

  useEffect(() => {
    if (isAllDone) {
      onComplete();
      return;
    }

    if (typingSpeedMs === 0) {
      setCurrentText(currentFullText);
      setCharIndex(currentFullText.length);
      return;
    }

    if (charIndex >= currentFullText.length) {
      return;
    }

    timerRef.current = window.setInterval(() => {
      setCharIndex(i => {
        const fullText = currentFullTextRef.current;
        if (i >= fullText.length) {
          clearTimer();
          return i;
        }
        const next = i + 1;
        setCurrentText(fullText.slice(0, next));
        if (next >= fullText.length) {
          clearTimer();
        }
        return next;
      });
    }, typingSpeedMs);

    return clearTimer;
  }, [currentParagraphIndex, paragraphs, charIndex, isAllDone, clearTimer, onComplete, typingSpeedMs]);

  useEffect(() => {
    setFinishedCount(0);
    setCurrentText('');
    setCharIndex(0);
  }, [paragraphs]);

  useEffect(() => {
    if (typingSpeedMs === 0 && !isAllDone) {
      setFinishedCount(paragraphs.length);
      setCurrentText('');
      setCharIndex(0);
      onComplete();
    }
  }, [typingSpeedMs, isAllDone, paragraphs.length, onComplete]);

  const renderedParagraphs = [];
  for (let i = 0; i < finishedCount; i++) {
    renderedParagraphs.push(
      <p key={i} className="mb-4">{paragraphs[i]}</p>
    );
  }
  if (!isAllDone) {
    renderedParagraphs.push(
      <p key={currentParagraphIndex} className="mb-4">{currentText}</p>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={isAllDone ? '文本已显示完毕' : isCurrentTyping ? '点击加速或按空格继续' : '点击或按空格继续'}
      onClick={handleClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      style={{ cursor: isAllDone ? 'default' : 'pointer', outline: 'none' }}
    >
      {renderedParagraphs}
      {!isAllDone && typingSpeedMs > 0 && (
        <p className="text-xs mt-2 italic select-none" style={{ color: '#7a5a30', textIndent: 0 }}>
          {isCurrentTyping ? '（点击加速）' : '（点击继续）'}
        </p>
      )}
    </div>
  );
}
