import { useEffect, useState } from 'react';
import { isLowPerf } from '../utils/perf';

interface LoadingScreenProps {
  progress: number;
  hint?: string;
  onSkip?: () => void;
  showSkip?: boolean;
}

const hints = [
  '正从荒岛寄出漂流瓶……',
  '海风正在翻动书页……',
  '羊皮卷正在展开……',
  '鹦鹉在整理羽毛……',
  '潮水正在涨落……',
  '椰树在风中摇曳……',
];

export function LoadingScreen({ progress, hint, onSkip, showSkip = true }: LoadingScreenProps) {
  const [hintIndex, setHintIndex] = useState(0);
  const lowPerf = isLowPerf();
  const canSkip = showSkip && progress >= 15 && onSkip;

  useEffect(() => {
    const timer = setInterval(() => {
      setHintIndex(i => (i + 1) % hints.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const currentHint = hint || hints[hintIndex];

  return (
    <div
      className="book-shell flex flex-col items-center justify-center"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        padding: '2rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '24rem',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            letterSpacing: '0.25em',
            color: '#1a1008',
            marginBottom: '0.5rem',
            textIndent: 0,
            animation: lowPerf ? 'none' : 'fadeIn 0.8s ease-out',
          }}
        >
          鲁滨孙漂流记
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            color: '#7a5a30',
            opacity: 0.7,
            letterSpacing: '0.1em',
            marginBottom: '2.5rem',
            textIndent: 0,
          }}
        >
          Robinson Crusoe
        </div>

        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`加载进度 ${Math.round(progress)}%`}
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(122, 90, 48, 0.15)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.max(5, Math.min(100, progress))}%`,
              background: 'linear-gradient(90deg, #7a5a30, #a07040)',
              borderRadius: '2px',
              transition: lowPerf ? 'none' : 'width 0.3s ease-out',
            }}
          />
        </div>

        <div
          style={{
            fontSize: '0.875rem',
            color: '#7a5a30',
            textIndent: 0,
            minHeight: '1.5rem',
            transition: lowPerf ? 'none' : 'opacity 0.4s ease',
          }}
          key={currentHint}
        >
          {currentHint}
        </div>

        <div
          style={{
            fontSize: '0.75rem',
            color: '#a08060',
            marginTop: '0.5rem',
            textIndent: 0,
            opacity: 0.6,
            marginBottom: canSkip ? '1.5rem' : 0,
          }}
        >
          {Math.round(progress)}%
        </div>

        {canSkip && (
          <button
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: '1px solid rgba(122, 90, 48, 0.4)',
              color: '#7a5a30',
              padding: '0.5rem 1.5rem',
              fontSize: '0.8125rem',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderRadius: '2px',
              transition: lowPerf ? 'none' : 'all 0.2s ease',
            }}
          >
            跳过，直接进入
          </button>
        )}
      </div>
    </div>
  );
}
