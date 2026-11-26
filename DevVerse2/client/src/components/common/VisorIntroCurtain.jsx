import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { heroRobotDark, heroRobotLight } from '../../utils/assets';

const INTRO_STORAGE_KEY = 'dv_visor_intro_seen';

export default function VisorIntroCurtain() {
  const location = useLocation();
  const { motion: motionPref } = useTheme();
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const pointerRef = useRef({ x: -999, y: -999, nx: 0, ny: 0, active: false });
  const [mascotOffset, setMascotOffset] = useState({ x: 0, y: 0, rx: 0, ry: 0 });

  const isHome = location.pathname === '/';
  const isTestEnv = import.meta.env.MODE === 'test';
  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const disabled = isTestEnv || motionPref === 'off' || prefersReduced;

  const [open, setOpen] = useState(() => {
    if (disabled || !isHome) return false;
    try {
      return !window.sessionStorage.getItem(INTRO_STORAGE_KEY);
    } catch {
      return true;
    }
  });

  const dismiss = () => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  // Scroll down to reveal Home Page; scroll UP when at top of Home Page to pull curtain back down
  useEffect(() => {
    if (disabled || !isHome) return undefined;
    let touchStartY = 0;

    const onWheel = (e) => {
      if (open && e.deltaY > 18) {
        dismiss();
      } else if (!open && window.scrollY <= 4 && e.deltaY < -24) {
        setOpen(true);
      }
    };

    const onTouchStart = (e) => {
      touchStartY = e.touches?.[0]?.clientY || 0;
    };

    const onTouchMove = (e) => {
      const y = e.touches?.[0]?.clientY || 0;
      const diff = touchStartY - y;
      if (open && diff > 35) {
        dismiss();
      } else if (!open && window.scrollY <= 4 && diff < -45) {
        setOpen(true);
      }
    };

    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        dismiss();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, disabled, isHome]);

  // 60fps Cursor-Trail X-Ray Canvas Mask + Cursor-Following Mascot Sync
  useEffect(() => {
    if (!open || disabled) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const revealImg = new Image();
    revealImg.src = heroRobotLight;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (e) => {
      const nx = e.clientX / Math.max(1, width) - 0.5;
      const ny = e.clientY / Math.max(1, height) - 0.5;
      pointerRef.current = { x: e.clientX, y: e.clientY, nx, ny, active: true };
      setMascotOffset({
        x: nx * 38,
        y: ny * 26,
        rx: -ny * 10,
        ry: nx * 14,
      });

      trailRef.current.push({
        x: e.clientX,
        y: e.clientY,
        r: 76,
        born: performance.now(),
      });
      if (trailRef.current.length > 26) {
        trailRef.current.shift();
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });

    let rafId = 0;
    const render = (now) => {
      rafId = window.requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      trailRef.current = trailRef.current.filter((pt) => now - pt.born < 650);
      if (trailRef.current.length === 0) return;

      // 1. Metaball / visor cursor mask
      ctx.save();
      ctx.beginPath();
      trailRef.current.forEach((pt) => {
        const age = (now - pt.born) / 650;
        const radius = pt.r * (1 - age * 0.62);
        if (radius > 2) {
          ctx.moveTo(pt.x + radius, pt.y);
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        }
      });
      ctx.clip();

      // 2. Inside clipped visor: glowing neon violet/cyan cybernetic X-Ray layer
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        40,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.65
      );
      grad.addColorStop(0, '#2a1f5d');
      grad.addColorStop(0.55, '#112a38');
      grad.addColorStop(1, '#090b12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Neon wireframe grid inside X-Ray
      ctx.strokeStyle = 'rgba(79, 227, 193, 0.35)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 34) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 34) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      if (revealImg.complete && revealImg.naturalWidth > 0) {
        const targetH = Math.min(height * 0.68, 520);
        const targetW = (revealImg.naturalWidth / revealImg.naturalHeight) * targetH;
        const dx = pointerRef.current.nx * 38;
        const dy = pointerRef.current.ny * 26;
        ctx.drawImage(
          revealImg,
          width / 2 - targetW / 2 + dx,
          height / 2 - targetH / 2 + dy,
          targetW,
          targetH
        );
      }
      ctx.restore();

      // 3. Glowing visor ring around active cursor
      if (pointerRef.current.active) {
        ctx.save();
        ctx.strokeStyle = 'rgba(79, 227, 193, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pointerRef.current.x, pointerRef.current.y, 72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, [open, disabled]);

  if (disabled || !isHome) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="visor-intro"
          initial={{ y: '-100%' }}
          animate={{ y: '0%' }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[11000] flex flex-col items-center justify-between overflow-hidden bg-[#07080c] text-[#eef0f8] select-none"
        >
          {/* Dark Aurora + Topographic Contour Background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 25%, rgba(124,111,255,0.22) 0, transparent 52%), radial-gradient(circle at 75% 75%, rgba(79,227,193,0.16) 0, transparent 52%), repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 38px, rgba(255,255,255,0.04) 39px)',
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
              onClick={dismiss}
              className="mono rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:border-[var(--cyan)] hover:text-[var(--cyan)]"
            >
              Skip Intro →
            </button>
          </div>

          {/* Center Base Mascot following the cursor */}
          <div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center">
            <motion.img
              src={heroRobotDark}
              alt="DevVerse Builder"
              animate={{
                x: mascotOffset.x,
                y: mascotOffset.y,
                rotateX: mascotOffset.rx,
                rotateY: mascotOffset.ry,
              }}
              transition={{ type: 'spring', stiffness: 160, damping: 18, mass: 0.5 }}
              style={{ transformPerspective: 900 }}
              className="max-h-[68vh] max-w-[85vw] object-contain drop-shadow-[0_28px_60px_rgba(124,111,255,0.38)]"
            />
          </div>

          {/* Interactive Cursor-Trail X-Ray Reveal Canvas */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-15 h-full w-full"
          />

          {/* Bottom Telemetry & Scroll Prompt */}
          <div className="relative z-20 flex w-full flex-col items-center gap-3 pb-8 text-center">
            <div className="mono inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[var(--cyan)]" aria-hidden="true" />
              <span>Move cursor to X-Ray · Scroll down to enter</span>
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-semibold text-[#07080c] shadow-[0_10px_30px_-6px_var(--accent)] transition-transform hover:-translate-y-0.5"
            >
              <span>Enter DevVerse</span>
              <ArrowDown
                className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
