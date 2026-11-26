import { useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';

export function ScrollProgressBar() {
  const { motion: motionPref } = useTheme();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  if (motionPref === 'off') return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 right-0 top-[3px] z-[1003] h-[2px] origin-left bg-gradient-to-r from-[var(--violet)] via-[var(--cyan)] to-[var(--coral)] shadow-[0_0_12px_var(--accent)]"
      style={{ scaleX }}
    />
  );
}

export function ParallaxLayer({ children, speed = 40, className = '' }) {
  const ref = useRef(null);
  const { motion: motionPref } = useTheme();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-speed, speed]);

  if (motionPref === 'off') {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

export function RevealSection({ children, className = '', delay = 0 }) {
  const { motion: motionPref } = useTheme();

  if (motionPref === 'off') {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TiltCard({ children, className = '', maxTilt = 7, spotlight = true }) {
  const cardRef = useRef(null);
  const { motion: motionPref } = useTheme();
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, mx: 50, my: 50, active: false });

  if (motionPref === 'off') {
    return <div className={className}>{children}</div>;
  }

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTransform({
      rotateX: (0.5 - py) * maxTilt * 2,
      rotateY: (px - 0.5) * maxTilt * 2,
      mx: px * 100,
      my: py * 100,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setTransform((prev) => ({ ...prev, rotateX: 0, rotateY: 0, active: false }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`.trim()}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) ${
          transform.active ? 'translateZ(6px)' : ''
        }`,
      }}
    >
      {spotlight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: transform.active ? 1 : 0,
            background: `radial-gradient(380px circle at ${transform.mx}% ${transform.my}%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 65%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
