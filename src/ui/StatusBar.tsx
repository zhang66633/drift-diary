import { useGameStore } from '../store/gameStore';
import { Tooltip } from './Tooltip';
import { formatChineseDate } from '../utils/helpers';
import { DevPanel } from './DevPanel';

interface StatusBarProps {
  showGameMenu?: boolean;
  onToggleMenu?: () => void;
}

// Module-scope components to avoid unmount/remount on every render
function StatusItem({
  symbol,
  value,
  tooltip,
  label,
}: {
  symbol: string;
  value: string | number;
  tooltip: string;
  label: string;
}) {
  return (
    <Tooltip text={tooltip} position="bottom">
      <span
        className="inline-flex items-center"
        style={{ cursor: 'default' }}
        aria-label={`${label}：${value}`}
      >
        <span
          className="inline-flex items-center justify-center"
          style={{
            marginRight: '3px',
            color: '#7a5a30',
            fontSize: '0.7rem',
            width: '12px',
            opacity: 0.85,
          }}
        >
          {symbol}
        </span>
        <span
          className="text-[0.65rem] sm:text-xs"
          style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}
        >
          {value}
        </span>
      </span>
    </Tooltip>
  );
}

function Separator() {
  return (
    <span
      className="select-none hidden sm:inline"
      style={{ color: '#c4a87c', opacity: 0.5, fontSize: '0.75rem' }}
    >
      ·
    </span>
  );
}

export function StatusBar({ showGameMenu, onToggleMenu }: StatusBarProps) {
  const { isDebug, state, resources, time, flags } = useGameStore(s => ({
    isDebug: s.isDebugMode,
    state: s.gameState.state,
    resources: s.gameState.resources,
    time: s.gameState.time,
    flags: s.gameState.flags,
  }));

  // 移动端短日期，避免换行
  const dateStr = formatChineseDate(time.date);
  const compactDate = dateStr.replace(/^(\d+)年/, '');

  // 随身物品（flag 类道具）
  const inventoryItems = [
    { id: '圣经', label: '圣经', symbol: '✟' },
    { id: '钱币', label: '钱币', symbol: '£' },
    { id: '围栅', label: '围栅', symbol: '⊞' },
    { id: '有木筏', label: '木筏', symbol: '⚓' },
    { id: '火药分装', label: '火药已分', symbol: '✺' },
  ].filter(item => flags[item.id]);

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
        className="max-w-3xl mx-auto flex items-center gap-x-3"
        role="status"
        aria-label="游戏状态栏"
      >
        <div className="flex flex-nowrap sm:flex-wrap items-center gap-x-1.5 sm:gap-x-3 gap-y-1 flex-1 min-w-0 overflow-x-auto">
          <span className="hidden sm:contents">
            <StatusItem symbol="§" value={dateStr} tooltip="故事日期" label="故事日期" />
          </span>
          <span className="sm:hidden">
            <StatusItem symbol="§" value={compactDate} tooltip={`故事日期：${dateStr}`} label="故事日期" />
          </span>
          <Separator />
          <StatusItem symbol="†" value={state.健康} tooltip="健康：体力与性命，归零则亡" label="健康" />
          <Separator />
          <StatusItem symbol="※" value={state.士气} tooltip="士气：精神状态，过低则心志动摇" label="士气" />
          <Separator />
          <StatusItem symbol="‡" value={state.勇气} tooltip="勇气：面对险境的胆色" label="勇气" />

          {(resources.食物 > 0 || resources.淡水 > 0) && (
            <>
              <Separator />
              {resources.食物 > 0 && (
                <StatusItem symbol="▣" value={resources.食物} tooltip={`食物：${resources.食物}份`} label="食物" />
              )}
              {resources.淡水 > 0 && (
                <StatusItem symbol="💧" value={resources.淡水} tooltip={`淡水：${resources.淡水}份`} label="淡水" />
              )}
            </>
          )}

          {(resources.火药 > 0 || resources.弹药 > 0) && (
            <>
              <Separator />
              {resources.火药 > 0 && (
                <StatusItem symbol="✺" value={resources.火药} tooltip={`火药：${resources.火药}桶`} label="火药" />
              )}
              {resources.弹药 > 0 && (
                <StatusItem symbol="•" value={resources.弹药} tooltip={`弹药：${resources.弹药}发`} label="弹药" />
              )}
            </>
          )}

          {(resources.工具 > 0 || resources.装备 > 0) && (
            <>
              <Separator />
              {resources.工具 > 0 && (
                <StatusItem symbol="⚒" value={resources.工具} tooltip={`工具：${resources.工具}套`} label="工具" />
              )}
              {resources.装备 > 0 && (
                <StatusItem symbol="⛨" value={resources.装备} tooltip={`装备：${resources.装备}件`} label="装备" />
              )}
            </>
          )}

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

          {inventoryItems.length > 0 && (
            <>
              <Separator />
              {inventoryItems.map(item => (
                <StatusItem
                  key={item.id}
                  symbol={item.symbol}
                  value={item.label}
                  tooltip={`随身物品：${item.label}`}
                  label={item.label}
                />
              ))}
            </>
          )}
        </div>

        {onToggleMenu && (
          <button
            className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
            onClick={onToggleMenu}
            style={{
              color: '#7a5a30',
              border: '1px solid rgba(122, 90, 48, 0.4)',
              background: 'rgba(244, 236, 216, 0.92)',
              cursor: 'pointer',
              opacity: showGameMenu ? 1 : 0.65,
              width: '32px',
              height: '28px',
              padding: 0,
              borderRadius: '2px',
            }}
            title="菜单"
            aria-label={showGameMenu ? '关闭菜单' : '打开菜单'}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.borderColor = '#7a5a30';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = showGameMenu ? '1' : '0.65';
              e.currentTarget.style.borderColor = 'rgba(122, 90, 48, 0.4)';
            }}
          >
            <div
              className="flex flex-col items-center justify-center gap-[3px]"
              style={{ width: '14px' }}
            >
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  height: '1px',
                  background: '#7a5a30',
                  transition: 'transform 0.2s ease',
                  transform: showGameMenu ? 'translateY(4px) rotate(45deg)' : 'none',
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  height: '1px',
                  background: '#7a5a30',
                  transition: 'opacity 0.2s ease',
                  opacity: showGameMenu ? 0 : 1,
                }}
              />
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  height: '1px',
                  background: '#7a5a30',
                  transition: 'transform 0.2s ease',
                  transform: showGameMenu ? 'translateY(-4px) rotate(-45deg)' : 'none',
                }}
              />
            </div>
          </button>
        )}
      </div>

      {isDebug && <DevPanel />}
    </div>
  );
}
