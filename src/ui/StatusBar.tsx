import { useGameStore } from '../store/gameStore';
import { Tooltip } from './Tooltip';

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

  const formatDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    const cn = ['正','二','三','四','五','六','七','八','九','十','十一','十二'];
    return `${y}年${cn[m-1]}月${d}日`;
  };

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
      <span style={{ cursor: 'default' }} aria-label={`${label}：${value}`}>
        <span style={{ marginRight: '3px', color: '#7a5a30' }}>{symbol}</span>
        {value}
      </span>
    </Tooltip>
  );

  return (
    <div
      className="sticky top-0 z-20 px-6 py-2 text-xs"
      style={{
        background: 'rgba(244, 236, 216, 0.95)',
        borderBottom: '1px solid rgba(122, 90, 48, 0.3)',
        color: '#5a4635',
        textIndent: 0,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="max-w-3xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1" role="status" aria-label="游戏状态栏">
        <StatusItem symbol="§" value={formatDate(time.date)} tooltip="故事日期" label="故事日期" />
        <StatusItem symbol="†" value={state.健康} tooltip="健康：体力与性命，归零则亡" label="健康" />
        <StatusItem symbol="※" value={state.士气} tooltip="士气：精神状态，过低则心志动摇" label="士气" />
        <StatusItem symbol="‡" value={state.勇气} tooltip="勇气：面对险境的胆色" label="勇气" />

        {resources.同伴.length > 0 && (
          <StatusItem
            symbol="¶"
            value={resources.同伴.map(c => c.name).join('、')}
            tooltip="同伴：同行之人"
            label="同伴"
          />
        )}

        {resources.钱 > 0 && (
          <StatusItem symbol="£" value={resources.钱} tooltip="钱币：身上的英镑" label="钱币" />
        )}

        {isDebug && (
          <>
            <span className="ml-2 px-1" style={{ background: '#5a4220', color: '#f4ecd8' }}>DEBUG</span>
            <span>良心:{state.良心}</span>
            <span>天意:{providence}</span>
            <span>信念:{state.信念}</span>
            <span>航海:{skills.航海}</span>
            <span style={{ fontSize: '0.7rem' }}>
              场景:{sceneId}
            </span>
            {Object.keys(flags).length > 0 && (
              <span
                className="w-full text-[0.65rem]"
                style={{ color: '#7a5a30', textIndent: 0, lineHeight: 1.6 }}
              >
                flags: {Object.entries(flags).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
