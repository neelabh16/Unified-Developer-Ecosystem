import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

function formatCounterValue(val, decimals, suffix) {
  const num = Number(val) || 0;
  const formatted =
    decimals > 0 ? num.toFixed(decimals) : Math.round(num).toLocaleString();
  return `${formatted}${suffix}`;
}

export default function AnimatedCounter({
  value = 0,
  suffix = '',
  decimals = 0,
  duration = 1400,
  className = '',
}) {
  const { motion } = useTheme();
  const ref = useRef(null);
  const target = Number(value) || 0;

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const instantMode =
    motion === 'off' || prefersReduced || typeof window === 'undefined';

  const [animatedDisplay, setAnimatedDisplay] = useState(() =>
    formatCounterValue(target, decimals, suffix)
  );

  useEffect(() => {
    if (instantMode) return undefined;

    let timer = null;
    let observer = null;
    let started = false;

    const runAnimation = () => {
      if (started) return;
      started = true;
      const steps = 45;
      const intervalMs = Math.max(16, Math.round(duration / steps));
      let step = 0;

      timer = setInterval(() => {
        step += 1;
        const progress = Math.min(1, step / steps);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedDisplay(formatCounterValue(target * eased, decimals, suffix));
        if (step >= steps) {
          clearInterval(timer);
          timer = null;
          setAnimatedDisplay(formatCounterValue(target, decimals, suffix));
        }
      }, intervalMs);
    };

    if (typeof window.IntersectionObserver !== 'undefined' && ref.current) {
      observer = new window.IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            runAnimation();
            observer?.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
    } else {
      runAnimation();
    }

    return () => {
      if (timer) clearInterval(timer);
      if (observer) observer.disconnect();
    };
  }, [target, suffix, decimals, duration, instantMode]);

  const display = instantMode
    ? formatCounterValue(target, decimals, suffix)
    : animatedDisplay;

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
