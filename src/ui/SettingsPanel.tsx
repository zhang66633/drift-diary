import { useSettings, type TextSpeed, type NarrationMode } from '../store/settingsStore';

interface SettingsPanelProps {
  onClose: () => void;
}

const SPEED_OPTIONS: { value: TextSpeed; label: string }[] = [
  { value: 'slow', label: '慢' },
  { value: 'normal', label: '中' },
  { value: 'fast', label: '快' },
  { value: 'instant', label: '瞬间' },
];

const NARRATION_OPTIONS: { value: NarrationMode; label: string; desc: string }[] = [
  { value: 'always', label: '始终显示', desc: '旁白自动弹出' },
  { value: 'click', label: '点击展开', desc: '旁白点图标才显示' },
  { value: 'off', label: '关闭', desc: '不显示旁白' },
];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    textSpeed,
    narrationMode,
    debugMode,
    volume,
    setTextSpeed,
    setNarrationMode,
    setDebugMode,
    setVolume,
  } = useSettings();

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
        className="max-w-md w-full p-8"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f4ecd8',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
          border: '1px solid #7a5a30',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 id="settings-title" className="text-xl font-bold" style={{ color: '#3a2a15', textIndent: 0 }}>
            设置
          </h2>
          <button
            className="text-sm px-3 py-1"
            onClick={onClose}
            style={{ color: '#7a5a30', border: '1px solid #7a5a30', background: 'transparent', cursor: 'pointer' }}
          >
            关闭
          </button>
        </div>

        <Section title="文字速度">
          <div className="flex gap-2 mt-2" style={{ textIndent: 0 }}>
            {SPEED_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTextSpeed(opt.value)}
                className="px-4 py-2 text-sm transition-all"
                style={{
                  cursor: 'pointer',
                  border: textSpeed === opt.value ? '2px solid #5a4220' : '1px solid #c4a87c',
                  background: textSpeed === opt.value ? '#e8dcc0' : 'transparent',
                  color: '#3a2a15',
                  fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="旁白显示">
          <div className="flex flex-col gap-2 mt-2" style={{ textIndent: 0 }}>
            {NARRATION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setNarrationMode(opt.value)}
                className="px-4 py-2 text-sm text-left transition-all flex justify-between items-center"
                style={{
                  cursor: 'pointer',
                  border: narrationMode === opt.value ? '2px solid #5a4220' : '1px solid #c4a87c',
                  background: narrationMode === opt.value ? '#e8dcc0' : 'transparent',
                  color: '#3a2a15',
                  fontFamily: 'inherit',
                }}
              >
                <span>{opt.label}</span>
                <span className="text-xs italic" style={{ color: '#8a7050' }}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="音量">
          <div className="flex items-center gap-3 mt-2" style={{ textIndent: 0 }}>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={e => setVolume(parseInt(e.target.value, 10))}
              className="flex-1"
              style={{ accentColor: '#7a5a30' }}
            />
            <span className="text-sm w-10 text-right" style={{ color: '#5a4635' }}>{volume}</span>
          </div>
          <p className="text-xs italic mt-1" style={{ color: '#a08868', textIndent: 0 }}>
            （音量控制预留，音频功能开发中）
          </p>
        </Section>

        <Section title="调试模式">
          <label className="flex items-center gap-3 cursor-pointer" style={{ textIndent: 0 }}>
            <span className="text-sm" style={{ color: '#3a2a15' }}>
              显示场景ID和调试信息
            </span>
            <div
              role="switch"
              aria-checked={debugMode}
              aria-label="调试模式"
              tabIndex={0}
              onClick={() => setDebugMode(!debugMode)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDebugMode(!debugMode);
                }
              }}
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                background: debugMode ? '#7a5a30' : '#c4a87c',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#f4ecd8',
                position: 'absolute',
                top: '2px',
                left: debugMode ? '20px' : '2px',
                transition: 'left 0.2s',
              }} />
            </div>
          </label>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6" style={{ textIndent: 0 }}>
      <h3 className="text-sm font-bold" style={{ color: '#5a4220', textIndent: 0, letterSpacing: '0.1em' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
