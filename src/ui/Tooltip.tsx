import { useState, useRef, useId, useEffect, type ReactNode, Children, cloneElement, isValidElement } from 'react';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setVisible(true), 200);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // 点击立即显示，不等延迟
    setVisible(v => !v);
  };

  // 点击页面其他地方关闭 tooltip
  useEffect(() => {
    if (!visible) return;
    const close = () => setVisible(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [visible]);

  const child = Children.only(children);
  const trigger = isValidElement(child)
    ? cloneElement(child as React.ReactElement, {
        'aria-describedby': visible ? tooltipId : undefined,
      })
    : child;

  return (
    <span
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex', textIndent: 0 }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={handleClick}
    >
      {trigger}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            ...(position === 'top'
              ? { bottom: 'calc(100% + 6px)' }
              : { top: 'calc(100% + 6px)' }),
            padding: '4px 10px',
            background: '#2a1f14',
            color: '#f4ecd8',
            fontSize: '0.7rem',
            lineHeight: 1.4,
            whiteSpace: 'nowrap',
            borderRadius: '2px',
            pointerEvents: 'auto',
            zIndex: 50,
            fontFamily: 'inherit',
            letterSpacing: '0.05em',
            boxShadow: '0 2px 8px rgba(42, 31, 20, 0.3)',
            animation: 'tooltipFadeIn 0.15s ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          {text}
        </span>
      )}
    </span>
  );
}
