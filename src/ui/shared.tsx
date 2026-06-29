import React from 'react';

/**
 * 共享 SVG 纸张纹理 — 跨面板和覆盖层使用
 * 透明度由消费者通过 CSS 控制
 */
export const PAPER_TEXTURE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.65 0 0 0 0 0.55 0 0 0 0 0.40 0 0 0 0.03 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * 共享 Section 辅助组件 — 在 AboutPanel 和 SettingsPanel 中使用
 */
interface SectionProps {
  title: string;
  children: React.ReactNode;
  /** 标题下方是否显示边框 */
  bordered?: boolean;
}

export function Section({ title, children, bordered = false }: SectionProps) {
  return (
    <div className="mb-7" style={{ textIndent: 0 }}>
      <h3
        className="text-sm font-semibold mb-3 pb-1"
        style={{
          color: '#5a4220',
          letterSpacing: '0.15em',
          borderBottom: bordered ? '1px solid rgba(122, 90, 48, 0.25)' : 'none',
        }}
      >
        {title}
      </h3>
      <div className="text-sm leading-relaxed" style={{ textIndent: '2em' }}>
        {children}
      </div>
    </div>
  );
}
