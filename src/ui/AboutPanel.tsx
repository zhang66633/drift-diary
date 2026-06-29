import { Section } from './shared';

interface AboutPanelProps {
  onClose: () => void;
}

export function AboutPanel({ onClose }: AboutPanelProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      style={{ background: 'rgba(42, 31, 20, 0.78)' }}
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f4ecd8',
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.65 0 0 0 0 0.55 0 0 0 0 0.40 0 0 0 0.03 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")
          `,
          border: '2px solid #7a5a30',
          boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
          fontFamily: 'serif',
        }}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2
              id="about-title"
              className="text-xl font-bold mb-1"
              style={{ color: '#2a1508', letterSpacing: '0.12em' }}
            >
              关于本作
            </h2>
            <p className="text-xs" style={{ color: '#7a5a30', opacity: 0.7 }}>
              鲁滨孙漂流记 · 文字冒险 · v0.3
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1"
            style={{
              color: '#7a5a30',
              border: '1px solid #7a5a30',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            关闭 ×
          </button>
        </div>

        <div className="space-y-7" style={{ color: '#3a2a15', lineHeight: 1.9 }}>
          <Section bordered title="游戏特色">
            <p>
              这是一部基于丹尼尔·笛福原著《鲁滨孙漂流记》改编的文字冒险游戏。你的每一个选择都会影响克鲁索的命运——有些显而易见，有些潜藏暗处，直到多年后才浮出水面。
            </p>
            <p className="mt-2">
              没有"错误"的选择，只有不同的道路。你的过去永远在塑造你的现在。
            </p>
          </Section>

          <Section bordered title="世界如何回应你">
            <p>
              除了可见的状态——体力、心志、胆色——还有更深层的力量在暗中起作用。有些选择会改变你与他人的关系，有些则在冥冥之中改变了风向。你无法看见它们，但它们决定了有些路走得通，有些路走不通。
            </p>
            <p className="mt-2">
              这种设计源于原著的精髓：克鲁索从不完全掌控自己的命运。他选择航向，但风从何处来，不由他决定。
            </p>
          </Section>

          <Section bordered title="操作提示">
            <ul className="space-y-1 text-sm" style={{ listStyle: 'none', padding: 0 }}>
              <li><span style={{ color: '#7a5a30' }}>Esc</span> — 关闭当前菜单或浮层</li>
              <li><span style={{ color: '#7a5a30' }}>点击选项</span> — 推进剧情，每个决定都不可撤销</li>
              <li>打字机动画中点击正文可跳过动画，直接显示全文</li>
            </ul>
          </Section>

          <Section bordered title="创作说明">
            <p>
              改编自丹尼尔·笛福 <span style={{ fontStyle: 'italic' }}>Robinson Crusoe</span>（1719）。
              原著中克鲁索的独白天然带有回忆录体的反思性——多年后的自己回看年轻时的决定，带着悔恨、自嘲和宿命感。本作试图将这种叙事质感翻译为游戏机制：你的过去永远在塑造你的现在。
            </p>
            <p className="mt-2 text-xs" style={{ color: '#8a7050' }}>
              前两章（出走与奴役）为完整 Demo。第三章（荒岛初醒）开发中。
            </p>
          </Section>
        </div>

        <div className="mt-8 pt-4 text-center" style={{ borderTop: '1px dashed rgba(122, 90, 48, 0.25)' }}>
          <p className="text-xs" style={{ color: '#9a8060', letterSpacing: '0.1em' }}>
            "冥冥之中自有凌驾于一切之上的天意"
          </p>
        </div>
      </div>
    </div>
  );
}


