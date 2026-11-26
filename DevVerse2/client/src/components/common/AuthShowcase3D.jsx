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

export default function AuthShowcase3D({ className = '' }) {
  const containerRef = useRef(null);
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
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      return undefined;
    }

    const styles = getComputedStyle(document.documentElement);
    const accentHex = styles.getPropertyValue('--accent').trim() || '#7c6fff';
    const cyanHex = styles.getPropertyValue('--cyan').trim() || '#4fe3c1';
    const coralHex = styles.getPropertyValue('--coral').trim() || '#ff6b5b';

    const scene = new THREE.Scene();
    const w = container.clientWidth || 480;
    const h = container.clientHeight || 480;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 5.4;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);

    const group = new THREE.Group();
    scene.add(group);

    // Orbital Torus Rings
    const ringGeo = new THREE.TorusGeometry(1.75, 0.025, 16, 90);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHex),
      transparent: true,
      opacity: 0.42,
    });
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(cyanHex),
      transparent: true,
      opacity: 0.35,
    });

    const ring1 = new THREE.Mesh(ringGeo, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    const ring2 = new THREE.Mesh(ringGeo, ringMat2);
    ring2.rotation.y = Math.PI / 3;
    ring2.scale.setScalar(1.18);
    group.add(ring1, ring2);

    // Crystal Octahedron Core
    const crystalGeo = new THREE.OctahedronGeometry(0.95, 1);
    const crystalMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(cyanHex),
      wireframe: true,
      transparent: true,
      opacity: theme === 'light' ? 0.28 : 0.22,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    group.add(crystal);

    // Orbiting Particles
    const count = 110;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color(accentHex), new THREE.Color(cyanHex), new THREE.Color(coralHex)];

    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      const r = 1.6 + (i % 4) * 0.35;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a * 2) * 0.75;
      pos[i * 3 + 2] = Math.sin(a) * r;
      const c = palette[i % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(pGeo, pMat);
    group.add(particles);

    const pointer = { x: 0, y: 0 };
    const onPointer = (e) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 0.7;
      pointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 0.7;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let resizeObs = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const rw = Math.max(1, entry.contentRect.width);
        const rh = Math.max(1, entry.contentRect.height);
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh, false);
      });
      resizeObs.observe(container);
    }

    let rafId = 0;
    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      ring1.rotation.z += 0.004;
      ring2.rotation.z -= 0.003;
      crystal.rotation.y += 0.005;
      crystal.rotation.x += 0.002;
      particles.rotation.y -= 0.003;
      group.rotation.x += (pointer.y * 0.45 - group.rotation.x) * 0.05;
      group.rotation.y += (pointer.x * 0.55 - group.rotation.y) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointer);
      if (resizeObs) resizeObs.disconnect();
      ringGeo.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      renderer.dispose();
    };
  }, [disabled, theme, accent]);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
