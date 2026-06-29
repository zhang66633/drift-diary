import { useState, useRef, useId, useEffect, type ReactNode, Children, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const isTouchDevice = useRef(false);
  const tooltipId = useId();

  // Detect touch device once on mount
  useEffect(() => {
    isTouchDevice.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      top: position === 'top' ? rect.top - 6 : rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
  };

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updateCoords();
    timeoutRef.current = window.setTimeout(() => setVisible(true), 200);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updateCoords();
    // On touch devices, toggle on tap; on desktop, click does nothing (hover handles it)
    if (isTouchDevice.current) {
      setVisible(v => !v);
    }
  };

  // 点击页面其他地方关闭 + 滚动时更新位置
  useEffect(() => {
    if (!visible) return;
    const close = () => setVisible(false);
    document.addEventListener('pointerdown', close);
    window.addEventListener('scroll', updateCoords, { passive: true });
    window.addEventListener('resize', updateCoords);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('scroll', updateCoords);
      window.removeEventListener('resize', updateCoords);
    };
  }, [visible]);

  const child = Children.only(children);
  const trigger = isValidElement(child)
    ? cloneElement(child as React.ReactElement, {
        'aria-describedby': visible ? tooltipId : undefined,
      })
    : child;

  return (
    <>
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
      </span>
      {visible &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              transform: position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              padding: '4px 10px',
              background: '#2a1f14',
              color: '#f4ecd8',
              fontSize: '0.7rem',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              borderRadius: '2px',
              zIndex: 9999,
              fontFamily: 'serif',
              letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(42, 31, 20, 0.3)',
              animation: 'tooltipFadeIn 0.15s ease-out',
              pointerEvents: 'none',
            }}
          >
            {text}
          </span>,
          document.body
        )}
    </>
  );
}
