import { useGameStore } from '../store/gameStore';
import { Tooltip } from './Tooltip';
import { formatChineseDate } from '../utils/helpers';

export function StatusBar() {
  const { isDebug, state, resources, skills, providence, flags, time, sceneId } = useGameStore(s => ({
    isDebug: s.isDebugMode,
    state: s.gameState.state,
    resources: s.gameState.resources,
    skills: s.gameState.skills,
    providence: s._providence.getValue(),
    flags: s.gameState.flags,
    time: s.gameState.time,
    sceneId: s.gameState.currentSceneId,
  }));

  const StatusItem = ({
    symbol,
    value,
    tooltip,
    label,
  }: {
    symbol: string;
    value: string | number;
    tooltip: string;
    label: string;
  }) => (
    <Tooltip text={tooltip} position="bottom">
      <span
        className="inline-flex items-center"
        style={{ cursor: 'default' }}
        aria-label={`${label}：${value}`}
      >
        <span
          className="inline-flex items-center justify-center"
          style={{
            marginRight: '4px',
            color: '#7a5a30',
            fontSize: '0.75rem',
            width: '14px',
            opacity: 0.85,
          }}
        >
          {symbol}
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{value}</span>
      </span>
    </Tooltip>
  );

  const Separator = () => (
    <span
      className="select-none"
      style={{ color: '#c4a87c', opacity: 0.5, fontSize: '0.75rem' }}
    >
      ·
    </span>
  );

  return (
    <div
      className="sticky top-0 z-20 px-4 sm:px-6 py-2 text-xs"
      style={{
        background: 'linear-gradient(180deg, rgba(244, 236, 216, 0.98) 0%, rgba(244, 236, 216, 0.95) 100%)',
        borderBottom: '1px solid rgba(122, 90, 48, 0.25)',
        color: '#5a4635',
        textIndent: 0,
        backdropFilter: 'blur(6px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        className="max-w-3xl mx-auto flex flex-wrap items-center gap-x-3 gap-y-1"
        role="status"
        aria-label="游戏状态栏"
      >
        <StatusItem symbol="§" value={formatChineseDate(time.date)} tooltip="故事日期" label="故事日期" />
        <Separator />
        <StatusItem symbol="†" value={state.健康} tooltip="健康：体力与性命，归零则亡" label="健康" />
        <Separator />
        <StatusItem symbol="※" value={state.士气} tooltip="士气：精神状态，过低则心志动摇" label="士气" />
        <Separator />
        <StatusItem symbol="‡" value={state.勇气} tooltip="勇气：面对险境的胆色" label="勇气" />

        {resources.同伴.length > 0 && (
          <>
            <Separator />
            <StatusItem
              symbol="¶"
              value={resources.同伴.map(c => c.name).join('、')}
              tooltip="同伴：同行之人"
              label="同伴"
            />
          </>
        )}

        {resources.钱 > 0 && (
          <>
            <Separator />
            <StatusItem symbol="£" value={resources.钱} tooltip="钱币：身上的英镑" label="钱币" />
          </>
        )}

        {isDebug && (
          <div className="w-full mt-1 pt-1 border-t" style={{ borderColor: 'rgba(122, 90, 48, 0.2)' }}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className="px-2 py-0.5 text-[0.65rem] font-bold"
                style={{ background: '#5a4220', color: '#f4ecd8', borderRadius: '2px' }}
              >
                DEBUG
              </span>
              <span>良心:{state.良心}</span>
              <span>天意:{providence}</span>
              <span>信念:{state.信念}</span>
              <span>航海:{skills.航海}</span>
              <span style={{ fontSize: '0.65rem' }}>
                场景:{sceneId}
              </span>
              {Object.keys(flags).length > 0 && (
                <span
                  className="w-full text-[0.6rem]"
                  style={{ color: '#7a5a30', textIndent: 0, lineHeight: 1.6 }}
                >
                  flags: {Object.entries(flags).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
