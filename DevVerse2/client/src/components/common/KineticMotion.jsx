import { useRef, useState } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

/**
 * Masked kinetic word-by-word reveal (Awwwards / Lando-style headline entrance).
 */
export function KineticText({ text, className = '', delay = 0, as: Tag = 'span' }) {
  const { motion: motionPref } = useTheme();
  const words = String(text || '').split(' ');

  if (motionPref === 'off') {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={`inline-flex flex-wrap gap-x-[0.26em] ${className}`.trim()}>
      {words.map((word, idx) => (
        <span key={`${word}-${idx}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '115%', opacity: 0, rotate: 2.5 }}
            animate={{ y: '0%', opacity: 1, rotate: 0 }}
            transition={{
              duration: 0.62,
              delay: delay + idx * 0.055,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Scroll-velocity-reactive infinite horizontal marquee ribbon.
 * Accelerates with scroll speed and flips direction when scrolling up.
 */
export function VelocityMarquee({
  items = [],
  baseVelocity = -18,
  className = '',
}) {
  const { motion: motionPref } = useTheme();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1200], [0, 4], {
    clamp: false,
  });
  const skewX = useTransform(smoothVelocity, [-1500, 0, 1500], [-4, 0, 4]);

  const directionRef = useRef(1);

  useAnimationFrame((_, delta) => {
    if (motionPref === 'off') return;
    let moveBy = directionRef.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) directionRef.current = -1;
    else if (vf > 0) directionRef.current = 1;
    moveBy += directionRef.current * moveBy * Math.min(4, Math.abs(vf));

    let next = baseX.get() + moveBy;
    if (next <= -50) next += 50;
    if (next >= 0) next -= 50;
    baseX.set(next);
  });

  const x = useTransform(baseX, (v) => `${v}%`);
  const repeated = [...items, ...items, ...items, ...items];

  if (motionPref === 'off') {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden border-y border-[var(--border)] bg-[var(--surface)]/45 py-3.5 backdrop-blur-md ${className}`.trim()}
    >
      <motion.div
        className="flex w-max items-center gap-8 whitespace-nowrap will-change-transform"
        style={{ x, skewX }}
      >
        {repeated.map((item, idx) => (
          <span
            key={idx}
            className="mono inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] shadow-[0_0_8px_var(--cyan)]" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Magnetic cursor-attracted wrapper for primary CTAs & interactive pills.
 */
export function MagneticWrapper({ children, strength = 0.28, className = '' }) {
  const ref = useRef(null);
  const { motion: motionPref } = useTheme();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  if (motionPref === 'off') {
    return <div className={`inline-block ${className}`.trim()}>{children}</div>;
  }

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    setOffset({ x: dx, y: dy });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 320, damping: 20, mass: 0.4 }}
      className={`inline-block ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}

/**
 * Live Motorsport/OS-style scroll telemetry HUD pill in the bottom-left/right.
 */
export function TelemetryHud() {
  const { motion: motionPref } = useTheme();
  const { scrollYProgress } = useScroll();
  const [pct, setPct] = useState(0);

  useAnimationFrame(() => {
    const next = Math.round(scrollYProgress.get() * 100);
    if (next !== pct) setPct(next);
  });

  if (motionPref === 'off') return null;

  return (
    <div
      aria-hidden="true"
      className="mono pointer-events-none fixed bottom-6 left-1/2 z-[900] hidden -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--bg-panel)]/85 px-4 py-1.5 text-[10.5px] text-[var(--text-tertiary)] backdrop-blur-md md:flex"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--cyan)]" />
      <span>DEVVERSE OS</span>
      <span className="text-[var(--border-strong)]">|</span>
      <span className="text-[var(--accent)]">SCROLL {String(pct).padStart(2, '0')}%</span>
    </div>
  );
}
