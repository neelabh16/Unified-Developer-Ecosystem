import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { heroRobotDark, heroRobotLight } from '../../utils/assets';

export default function VisorIntroCurtain() {
  const { motion: motionPref } = useTheme();
  const mascotBoxRef = useRef(null);
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const [mascotOffset, setMascotOffset] = useState({ x: 0, y: 0, rx: 0, ry: 0 });
  const [progress, setProgress] = useState(0);

  const isTestEnv = import.meta.env.MODE === 'test';
  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const disabled = isTestEnv || motionPref === 'off' || prefersReduced;
  const [open, setOpen] = useState(() => !disabled);

  // Site loading progress (0% -> 100% over ~2.2s, then lifts smoothly)
  useEffect(() => {
    if (!open || disabled) return undefined;
    const start = performance.now();
    const duration = 2200;
    let rafId = 0;

    const tick = (now) => {
      const pct = Math.min(100, Math.round(((now - start) / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setTimeout(() => setOpen(false), 350);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [open, disabled]);

  // Cursor-following mascot + mascot-only X-Ray visor reveal
  useEffect(() => {
    if (!open || disabled) return undefined;
    const canvas = canvasRef.current;
    const box = mascotBoxRef.current;
    if (!canvas || !box) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const revealImg = new Image();
    revealImg.src = heroRobotLight;

    const syncSize = () => {
      const rect = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    syncSize();

    const onMove = (e) => {
      const vw = Math.max(1, window.innerWidth);
      const vh = Math.max(1, window.innerHeight);
      const nx = e.clientX / vw - 0.5;
      const ny = e.clientY / vh - 0.5;

      setMascotOffset({
        x: nx * 36,
        y: ny * 24,
        rx: -ny * 10,
        ry: nx * 14,
      });

      const rect = box.getBoundingClientRect();
      trailRef.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: 68,
        born: performance.now(),
      });
      if (trailRef.current.length > 24) {
        trailRef.current.shift();
      }
    };

    window.addEventListener('resize', syncSize);
    window.addEventListener('pointermove', onMove, { passive: true });

    let rafId = 0;
    const render = (now) => {
      rafId = window.requestAnimationFrame(render);
      const rect = box.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      trailRef.current = trailRef.current.filter((pt) => now - pt.born < 650);
      if (trailRef.current.length === 0) return;

      // 1. Draw cursor trail blobs on the mascot canvas
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      trailRef.current.forEach((pt) => {
        const age = (now - pt.born) / 650;
        const radius = pt.r * (1 - age * 0.62);
        if (radius > 2) {
          ctx.moveTo(pt.x + radius, pt.y);
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        }
      });
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // 2. Mask STRICTLY onto the alternate mascot silhouette (zero background bleed!)
      if (revealImg.complete && revealImg.naturalWidth > 0) {
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(revealImg, 0, 0, w, h);
      }
      ctx.restore();
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [open, disabled]);

  if (disabled) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="site-loader"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[11000] flex flex-col items-center justify-between overflow-hidden bg-[#07080c] text-[#eef0f8] select-none"
        >
          {/* Subtle Dark Aurora Backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 25%, rgba(124,111,255,0.2) 0, transparent 52%), radial-gradient(circle at 75% 75%, rgba(79,227,193,0.14) 0, transparent 52%)',
            }}
          />

          {/* Top Bar */}
          <div className="relative z-20 flex w-full items-center justify-between px-6 py-5 sm:px-10">
            <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-xs font-extrabold text-[#07080c]"
                style={{
                  background:
                    'conic-gradient(from 180deg, var(--violet), var(--cyan), var(--coral), var(--violet))',
                }}
              >
                DV
              </span>
              <span>DEVVERSE OS</span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mono rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
            >
              Skip →
            </button>
          </div>

          {/* Center Mascot with Mascot-Only Cursor Visor X-Ray */}
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <motion.div
              ref={mascotBoxRef}
              animate={{
                x: mascotOffset.x,
                y: mascotOffset.y,
                rotateX: mascotOffset.rx,
                rotateY: mascotOffset.ry,
              }}
              transition={{ type: 'spring', stiffness: 160, damping: 18, mass: 0.5 }}
              style={{ transformPerspective: 900 }}
              className="relative"
            >
              <img
                src={heroRobotDark}
                alt="DevVerse Loading Mascot"
                className="pointer-events-none block max-h-[62vh] max-w-[82vw] object-contain drop-shadow-[0_28px_60px_rgba(124,111,255,0.38)]"
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
            </motion.div>
          </div>

          {/* Bottom Loading Progress */}
          <div className="relative z-20 flex w-full max-w-xs flex-col items-center gap-2 pb-10">
            <div className="mono flex w-full justify-between text-[11px] uppercase tracking-widest text-white/60">
              <span>Initializing DevVerse</span>
              <span className="text-[var(--cyan)]">{progress}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--violet)] via-[var(--cyan)] to-[var(--coral)] transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
