import { useEffect, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

export default function CursorGlow() {
  const { motion } = useTheme();
  const [pos, setPos] = useState({ x: -400, y: -400 });

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const disabled = motion === 'off' || prefersReduced;

  useEffect(() => {
    if (disabled) return undefined;
    const onMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [disabled]);

  if (disabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-300"
      style={{
        background: `radial-gradient(520px circle at ${pos.x}px ${pos.y}px, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%)`,
      }}
    />
  );
}
