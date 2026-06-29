import { useRef, useCallback } from 'react';
import { useSettings, type TextSpeed } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import { Section } from './shared';

interface SettingsPanelProps {
  onClose: () => void;
}

const SPEED_OPTIONS: { value: TextSpeed; label: string }[] = [
  { value: 'slow', label: '慢' },
  { value: 'normal', label: '中' },
  { value: 'fast', label: '快' },
  { value: 'instant', label: '瞬间' },
];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    textSpeed,
    volume,
    sfxVolume,
    setTextSpeed,
    setVolume,
    setSfxVolume,
  } = useSettings();
  const _audio = useGameStore(s => s._audio);
  const volumeTimerRef = useRef<number | null>(null);

  const debouncedSetVolume = useCallback((v: number) => {
    setVolume(v);
    _audio.setMasterVolume(v);
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
    volumeTimerRef.current = window.setTimeout(() => {
      // persist happens via settingsStore
    }, 150);
  }, [setVolume, _audio]);

  const debouncedSetSfxVolume = useCallback((v: number) => {
    setSfxVolume(v);
    _audio.setSfxVolume(v);
  }, [setSfxVolume, _audio]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      style={{ background: 'rgba(42, 31, 20, 0.75)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full p-8 overlay-panel"
        onClick={e => e.stopPropagation()}
        style={{
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] mb-1" style={{ color: '#7a5a30', opacity: 0.6, textIndent: 0 }}>
              设 置
            </p>
            <h2 id="settings-title" className="text-xl font-semibold" style={{ color: '#3a2a15', textIndent: 0, letterSpacing: '0.1em' }}>
              游戏设置
            </h2>
          </div>
          <button
            className="text-sm px-4 py-1.5 transition-all duration-200 hover:opacity-80"
            onClick={onClose}
            style={{
              color: '#7a5a30',
              border: '1px solid #7a5a30',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            关闭
          </button>
        </div>

        <Section title="文字速度">
          <div className="flex gap-2 mt-3" style={{ textIndent: 0 }}>
            {SPEED_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTextSpeed(opt.value)}
                aria-pressed={textSpeed === opt.value}
                className="flex-1 px-3 py-2.5 text-sm transition-all duration-200"
                style={{
                  cursor: 'pointer',
                  border: textSpeed === opt.value ? '2px solid #5a4220' : '1px solid #c4a87c',
                  background: textSpeed === opt.value ? '#e8dcc0' : 'transparent',
                  color: '#3a2a15',
                  fontFamily: 'inherit',
                  letterSpacing: '0.05em',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="主音量">
          <div className="flex items-center gap-3 mt-3" style={{ textIndent: 0 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              aria-label="主音量"
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                debouncedSetVolume(v);
              }}
              className="flex-1"
              style={{ accentColor: '#7a5a30' }}
            />
            <span className="text-sm w-12 text-right font-mono" style={{ color: '#5a4635' }}>{volume}</span>
          </div>
        </Section>

        <Section title="音效音量">
          <div className="flex items-center gap-3 mt-3" style={{ textIndent: 0 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={sfxVolume}
              aria-label="音效音量"
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                debouncedSetSfxVolume(v);
              }}
              className="flex-1"
              style={{ accentColor: '#7a5a30' }}
            />
            <span className="text-sm w-12 text-right font-mono" style={{ color: '#5a4635' }}>{sfxVolume}</span>
          </div>
        </Section>

      </div>
    </div>
  );
}
