import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export function NProgressBar() {
  const location = useLocation();
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (active) {
      ref.current.style.opacity = '1';
      ref.current.style.width = '70%';
    } else {
      ref.current.style.width = '100%';
      const t = setTimeout(() => {
        if (ref.current) {
          ref.current.style.opacity = '0';
          ref.current.style.width = '0%';
        }
      }, 250);
      return () => clearTimeout(t);
    }
  }, [active]);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.transition = 'none';
      ref.current.style.width = '0%';
      ref.current.style.opacity = '1';
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.style.transition = 'width 300ms ease, opacity 300ms ease';
          ref.current.style.width = '40%';
        }
      });
    }
  }, [location.pathname]);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 h-[3px] bg-primary-500 z-[9999] transition-all duration-300"
      style={{ width: '0%', opacity: 0 }}
    />
  );
}
