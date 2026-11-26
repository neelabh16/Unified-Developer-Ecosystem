import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../hooks/useTheme';

function hasWebGL() {
  if (typeof window === 'undefined' || typeof window.WebGLRenderingContext === 'undefined') {
    return false;
  }
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2', { alpha: true }) || c.getContext('webgl', { alpha: true }));
  } catch {
    return false;
  }
}

export default function AmbientThreeField() {
  const canvasRef = useRef(null);
  const { motion, theme, accent } = useTheme();
  const [supported] = useState(() => hasWebGL());

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const disabled = !supported || motion === 'off' || prefersReduced;

  useEffect(() => {
    if (disabled) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
    } catch {
      return undefined;
    }

    const styles = getComputedStyle(document.documentElement);
    const violetHex = styles.getPropertyValue('--accent').trim() || '#7c6fff';
    const cyanHex = styles.getPropertyValue('--cyan').trim() || '#4fe3c1';
    const coralHex = styles.getPropertyValue('--coral').trim() || '#ff6b5b';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.1,
      100
    );
    camera.position.z = 14;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const starCount = 220;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const palette = [
      new THREE.Color(violetHex),
      new THREE.Color(cyanHex),
      new THREE.Color(coralHex),
    ];

    for (let i = 0; i < starCount; i += 1) {
      positions[i * 3] = (((i * 73) % 100) / 100 - 0.5) * 28;
      positions[i * 3 + 1] = (((i * 137) % 100) / 100 - 0.5) * 24;
      positions[i * 3 + 2] = (((i * 199) % 100) / 100 - 0.5) * 18;
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: theme === 'light' ? 0.08 : 0.095,
      vertexColors: true,
      transparent: true,
      opacity: theme === 'light' ? 0.42 : 0.65,
    });

    const stars = new THREE.Points(geo, mat);
    scene.add(stars);

    const pointer = { x: 0, y: 0 };
    const onPointer = (e) => {
      pointer.x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 0.8;
      pointer.y = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 0.8;
    };
    const onResize = () => {
      const w = window.innerWidth;
      const h = Math.max(1, window.innerHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    let rafId = 0;
    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      const scrollRatio = window.scrollY * 0.0012;
      stars.rotation.y += 0.0005;
      stars.rotation.x += (pointer.y * 0.15 + scrollRatio * 0.35 - stars.rotation.x) * 0.04;
      stars.position.y = -scrollRatio * 2.2;
      camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.03;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [disabled, theme, accent]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[1] h-full w-full"
    />
  );
}
