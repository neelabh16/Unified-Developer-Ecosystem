import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../hooks/useTheme';

function readCssVar(name, fallback) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

function detectWebGLSupport() {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof window.WebGLRenderingContext === 'undefined'
  ) {
    return false;
  }
  try {
    const probeCanvas = document.createElement('canvas');
    return Boolean(
      probeCanvas.getContext('webgl2', { alpha: true }) ||
        probeCanvas.getContext('webgl', { alpha: true })
    );
  } catch {
    return false;
  }
}

export default function HeroCanvas({ className = '', height = 420 }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { motion, theme, accent } = useTheme();
  const [fallbackMode, setFallbackMode] = useState(() => !detectWebGLSupport());

  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const shouldRenderFallback = fallbackMode || motion === 'off' || prefersReduced;

  useEffect(() => {
    if (shouldRenderFallback) return undefined;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    let renderer;
    try {
      const ctx =
        canvas.getContext('webgl2', { alpha: true, antialias: true }) ||
        canvas.getContext('webgl', { alpha: true, antialias: true });
      if (!ctx) {
        queueMicrotask(() => setFallbackMode(true));
        return undefined;
      }
      renderer = new THREE.WebGLRenderer({
        canvas,
        context: ctx,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      queueMicrotask(() => setFallbackMode(true));
      return undefined;
    }

    const accentHex = readCssVar('--accent', '#7c6fff');
    const cyanHex = readCssVar('--cyan', '#4fe3c1');
    const coralHex = readCssVar('--coral', '#ff6b5b');

    const scene = new THREE.Scene();
    const width = container.clientWidth || 640;
    const targetHeight = container.clientHeight || height;
    const camera = new THREE.PerspectiveCamera(48, width / targetHeight, 0.1, 100);
    camera.position.z = 6.2;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, targetHeight, false);

    const group = new THREE.Group();
    scene.add(group);

    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color(accentHex),
      new THREE.Color(cyanHex),
      new THREE.Color(coralHex),
    ];

    for (let i = 0; i < particleCount; i += 1) {
      const theta = (i * 2.399963) % (Math.PI * 2);
      const phi = Math.acos(1 - (2 * (i + 0.5)) / particleCount);
      const radius = 2.1 + (i % 5) * 0.28;
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.85;
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
    });
    const points = new THREE.Points(pointsGeo, pointsMat);
    group.add(points);

    const wireGeo = new THREE.IcosahedronGeometry(1.75, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHex),
      wireframe: true,
      transparent: true,
      opacity: theme === 'light' ? 0.22 : 0.16,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    group.add(wireMesh);

    const pointer = { x: 0, y: 0 };
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 0.6;
      pointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 0.6;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let resizeObs = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.max(1, entry.contentRect.width);
        const h = Math.max(1, entry.contentRect.height || height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      });
      resizeObs.observe(container);
    }

    let rafId = 0;
    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      group.rotation.y += 0.0022;
      group.rotation.x += (pointer.y * 0.45 - group.rotation.x) * 0.04;
      group.rotation.z += (-pointer.x * 0.25 - group.rotation.z) * 0.04;
      wireMesh.rotation.y -= 0.0014;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      if (resizeObs) resizeObs.disconnect();
      pointsGeo.dispose();
      pointsMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      renderer.dispose();
    };
  }, [shouldRenderFallback, height, theme, accent]);

  if (shouldRenderFallback) {
    return (
      <div
        ref={containerRef}
        data-testid="hero-canvas-fallback"
        aria-hidden="true"
        className={`pointer-events-none relative overflow-hidden rounded-3xl ${className}`.trim()}
        style={{
          height: `${height}px`,
          background:
            'radial-gradient(circle at 60% 45%, var(--accent-soft), transparent 62%), radial-gradient(circle at 30% 70%, var(--cyan-soft), transparent 55%)',
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="hero-canvas-webgl"
      aria-hidden="true"
      className={`pointer-events-none relative overflow-hidden ${className}`.trim()}
      style={{ height: `${height}px` }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
