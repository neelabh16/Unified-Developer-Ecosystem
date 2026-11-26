import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { heroRobotDark, heroRobotLight } from '../../utils/assets';

const INTRO_STORAGE_KEY = 'dv_visor_intro_seen';

export default function VisorIntroCurtain({ forceOpen = false, onDismiss }) {
  const { motion: motionPref } = useTheme();
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const pointerRef = useRef({ x: -999, y: -999, active: false });

  const isTestEnv = import.meta.env.MODE === 'test';
  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [dismissed, setDismissed] = useState(() => {
    if (isTestEnv || motionPref === 'off' || prefersReduced) return true;
    try {
      return Boolean(window.sessionStorage.getItem(INTRO_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  const open = forceOpen || !dismissed;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    onDismiss?.();
  };

  // Dismiss on wheel down, swipe up, or Escape/Space/Enter
  useEffect(() => {
    if (!open) return undefined;
    let touchStartY = 0;

    const onWheel = (e) => {
      if (e.deltaY > 18) dismiss();
    };
    const onTouchStart = (e) => {
      touchStartY = e.touches?.[0]?.clientY || 0;
    };
    const onTouchMove = (e) => {
      const y = e.touches?.[0]?.clientY || 0;
      if (touchStartY - y > 35) dismiss();
    };
    const onKey = (e) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 60fps Cursor-Trail X-Ray Canvas Mask revealing the cybernetic layer
  useEffect(() => {
    if (!open) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const revealImg = new Image();
    revealImg.src = heroRobotDark;

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
      pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
      trailRef.current.push({
        x: e.clientX,
        y: e.clientY,
        r: 72,
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

      // Prune faded trail blobs (lifetime ~650ms)
      trailRef.current = trailRef.current.filter((pt) => now - pt.born < 650);
      if (trailRef.current.length === 0) return;

      // 1. Draw metaball/visor cursor mask
      ctx.save();
      ctx.beginPath();
      trailRef.current.forEach((pt) => {
        const age = (now - pt.born) / 650;
        const radius = pt.r * (1 - age * 0.65);
        if (radius > 2) {
          ctx.moveTo(pt.x + radius, pt.y);
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        }
      });
      ctx.clip();

      // 2. Inside clipped visor region: draw dark cybernetic backdrop + neon grid + dark robot
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        40,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.65
      );
      grad.addColorStop(0, '#13162a');
      grad.addColorStop(1, '#07080c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle cyber wireframe grid inside X-Ray
      ctx.strokeStyle = 'rgba(79, 227, 193, 0.22)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < width; gx += 38) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 38) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      if (revealImg.complete && revealImg.naturalWidth > 0) {
        const targetH = Math.min(height * 0.68, 520);
        const targetW = (revealImg.naturalWidth / revealImg.naturalHeight) * targetH;
        ctx.drawImage(
          revealImg,
          width / 2 - targetW / 2,
          height / 2 - targetH / 2,
          targetW,
          targetH
        );
      }
      ctx.restore();

      // 3. Draw glowing visor rim around active pointer
      if (pointerRef.current.active) {
        ctx.save();
        ctx.strokeStyle = 'rgba(124, 111, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pointerRef.current.x, pointerRef.current.y, 68, 0, Math.PI * 2);
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
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="visor-intro"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[11000] flex flex-col items-center justify-between overflow-hidden bg-[#f4f5fa] text-[#0d0f17] select-none"
        >
          {/* Topographic Contour Background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(124,111,255,0.12) 0, transparent 58%), repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 36px, rgba(13,15,23,0.06) 37px)',
            }}
          />

          {/* Top Bar */}
          <div className="relative z-20 flex w-full items-center justify-between px-6 py-5 sm:px-10">
            <div className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0d0f17] text-xs font-extrabold text-white">
                DV
              </span>
              <span>DEVVERSE OS</span>
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="mono rounded-full border border-[#0d0f17]/20 bg-white/80 px-4 py-1.5 text-xs font-semibold text-[#0d0f17] backdrop-blur-md transition hover:bg-[#0d0f17] hover:text-white"
            >
              Skip Intro →
            </button>
          </div>

          {/* Center Base Mascot (Light) */}
          <div className="pointer-events-none relative z-10 flex flex-1 items-center justify-center">
            <img
              src={heroRobotLight}
              alt="DevVerse Builder"
              className="max-h-[68vh] max-w-[85vw] object-contain drop-shadow-[0_24px_48px_rgba(13,15,23,0.18)]"
            />
          </div>

          {/* Interactive Cursor-Trail X-Ray Reveal Canvas */}
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 z-15 h-full w-full"
          />

          {/* Bottom Telemetry & Scroll-Up Prompt */}
          <div className="relative z-20 flex w-full flex-col items-center gap-3 pb-8 text-center">
            <div className="mono inline-flex items-center gap-2 rounded-full border border-[#0d0f17]/15 bg-white/85 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#0d0f17] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#7c6fff]" aria-hidden="true" />
              <span>Move cursor to X-Ray · Scroll to enter</span>
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="group inline-flex items-center gap-2 rounded-full bg-[#0d0f17] px-6 py-2.5 text-xs font-semibold text-white shadow-xl transition-transform hover:-translate-y-0.5"
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
