import { useMemo } from 'react';
import { useTheme } from '../../hooks/useTheme';

function buildParticles(count) {
  return Array.from({ length: count }, (_, idx) => {
    const seed = (idx + 1) * 7919;
    const left = ((seed * 17) % 98) + 1;
    const top = ((seed * 29) % 92) + 8;
    const size = ((seed % 3) + 2);
    const duration = 12 + (seed % 14);
    const delay = -((seed * 7) % 18);
    return {
      id: idx,
      left: `${left}%`,
      top: `${top}%`,
      width: `${size}px`,
      height: `${size}px`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
    };
  });
}

export default function AuroraBackground({ showParticles = true, className = '' }) {
  const { motion } = useTheme();
  const isReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const count =
    typeof window !== 'undefined' && window.innerWidth < 700 ? 14 : 28;

  const particles = useMemo(() => buildParticles(count), [count]);

  return (
    <>
      <div className={`aurora-bg ${className}`.trim()} aria-hidden="true" />
      {showParticles && motion !== 'off' && !isReduced && (
        <div id="particle-field" aria-hidden="true">
          {particles.map((p) => (
            <span
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                top: p.top,
                width: p.width,
                height: p.height,
                animationDuration: p.animationDuration,
                animationDelay: p.animationDelay,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
