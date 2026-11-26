import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../hooks/useTheme';

function readCssVar(name, fallback) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

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
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      return undefined;
    }

    const accentHex = readCssVar('--accent', '#7c6fff');
    const cyanHex = readCssVar('--cyan', '#4fe3c1');
    const coralHex = readCssVar('--coral', '#ff6b5b');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / Math.max(1, window.innerHeight),
      0.1,
      100
    );
    camera.position.z = 7.2;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    // Central Sculptural 3D Group (visible and morphing as you scroll the whole page)
    const sculpture = new THREE.Group();
    scene.add(sculpture);

    const wireGeo = new THREE.IcosahedronGeometry(2.1, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accentHex),
      wireframe: true,
      transparent: true,
      opacity: theme === 'light' ? 0.16 : 0.14,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    sculpture.add(wireMesh);

    const knotGeo = new THREE.TorusKnotGeometry(1.15, 0.28, 100, 16);
    const knotMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(cyanHex),
      wireframe: true,
      transparent: true,
      opacity: theme === 'light' ? 0.16 : 0.13,
    });
    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    sculpture.add(knotMesh);

    const orbitRingGeo = new THREE.TorusGeometry(2.8, 0.02, 12, 96);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(coralHex),
      transparent: true,
      opacity: theme === 'light' ? 0.25 : 0.28,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2.6;
    sculpture.add(orbitRing);

    // Full-Viewport 3D Particle Starfield
    const starCount = 260;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const palette = [
      new THREE.Color(accentHex),
      new THREE.Color(cyanHex),
      new THREE.Color(coralHex),
    ];

    for (let i = 0; i < starCount; i += 1) {
      positions[i * 3] = (((i * 73) % 100) / 100 - 0.5) * 26;
      positions[i * 3 + 1] = (((i * 137) % 100) / 100 - 0.5) * 22;
      positions[i * 3 + 2] = (((i * 199) % 100) / 100 - 0.5) * 16;
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: theme === 'light' ? 0.075 : 0.09,
      vertexColors: true,
      transparent: true,
      opacity: theme === 'light' ? 0.42 : 0.68,
    });

    const stars = new THREE.Points(starGeo, starMat);
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
      const scrollRatio = window.scrollY * 0.0014;

      // Scroll-driven 3D flight across the whole page
      sculpture.rotation.y += 0.0022;
      sculpture.rotation.x += (pointer.y * 0.45 + scrollRatio * 0.75 - sculpture.rotation.x) * 0.05;
      sculpture.rotation.z += (-pointer.x * 0.28 + scrollRatio * 0.2 - sculpture.rotation.z) * 0.05;
      sculpture.position.x = Math.sin(scrollRatio * 1.1) * 1.4;
      sculpture.position.y = Math.cos(scrollRatio * 0.8) * 0.45;

      wireMesh.rotation.y -= 0.0014;
      knotMesh.rotation.x += 0.003;
      knotMesh.rotation.y += 0.002;
      orbitRing.rotation.z += 0.0025;

      stars.rotation.y += 0.0005;
      stars.rotation.x += (pointer.y * 0.15 + scrollRatio * 0.35 - stars.rotation.x) * 0.04;
      stars.position.y = -(scrollRatio * 1.5) % 6;

      camera.position.x += (pointer.x * 0.7 - camera.position.x) * 0.035;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
      wireGeo.dispose();
      wireMat.dispose();
      knotGeo.dispose();
      knotMat.dispose();
      orbitRingGeo.dispose();
      orbitRingMat.dispose();
      starGeo.dispose();
      starMat.dispose();
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
