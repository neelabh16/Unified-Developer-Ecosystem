import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { useTheme } from '../../hooks/useTheme';

const DEFAULT_DOMAINS = [
  { name: 'AI & ML', color: '#7c6fff' },
  { name: 'Developer Tools', color: '#4fe3c1' },
  { name: 'Systems', color: '#ff6b5b' },
  { name: 'Web Apps', color: '#ffb86b' },
  { name: 'Security', color: '#7c6fff' },
  { name: 'Data & Infra', color: '#4fe3c1' },
  { name: 'Open Source', color: '#f0c419' },
  { name: 'Mobile', color: '#ff6b5b' },
];

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

export default function TechUniverse3D({ categories = [] }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const { motion, theme } = useTheme();
  const [supported] = useState(() => hasWebGL());
  const [activeDomain, setActiveDomain] = useState(null);

  const domains =
    categories.length >= 4
      ? categories.slice(0, 8).map((name, idx) => ({
          name,
          color: DEFAULT_DOMAINS[idx % DEFAULT_DOMAINS.length].color,
        }))
      : DEFAULT_DOMAINS;

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

    const scene = new THREE.Scene();
    const w = container.clientWidth || 520;
    const h = container.clientHeight || 320;
    const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
    camera.position.z = 6.2;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);

    const group = new THREE.Group();
    scene.add(group);

    // Core wireframe sphere
    const coreGeo = new THREE.SphereGeometry(0.7, 20, 20);
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#7c6fff'),
      wireframe: true,
      transparent: true,
      opacity: theme === 'light' ? 0.35 : 0.25,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Constellation Nodes + Filaments
    const nodeGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const nodePositions = [];
    const nodeMeshes = [];
    const linePoints = [];

    for (let i = 0; i < 8; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 8);
      const theta = i * 2.399963;
      const r = 2.15;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.85;
      const z = r * Math.cos(phi);
      const vec = new THREE.Vector3(x, y, z);
      nodePositions.push(vec);

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(DEFAULT_DOMAINS[i].color),
      });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.copy(vec);
      group.add(mesh);
      nodeMeshes.push({ mesh, mat });

      // Connect to center & next node
      linePoints.push(new THREE.Vector3(0, 0, 0), vec);
    }

    for (let i = 0; i < nodePositions.length; i += 1) {
      const next = nodePositions[(i + 1) % nodePositions.length];
      linePoints.push(nodePositions[i], next);
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#4fe3c1'),
      transparent: true,
      opacity: theme === 'light' ? 0.35 : 0.28,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    group.add(lines);

    const pointer = { x: 0, y: 0 };
    const onPointer = (e) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((e.clientX - rect.left) / rect.width - 0.5) * 0.8;
      pointer.y = ((e.clientY - rect.top) / rect.height - 0.5) * 0.8;
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
      core.rotation.y += 0.004;
      group.rotation.y += 0.0028;
      group.rotation.x += (pointer.y * 0.5 - group.rotation.x) * 0.05;
      group.rotation.z += (-pointer.x * 0.25 - group.rotation.z) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointer);
      if (resizeObs) resizeObs.disconnect();
      coreGeo.dispose();
      coreMat.dispose();
      nodeGeo.dispose();
      nodeMeshes.forEach((n) => n.mat.dispose());
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
    };
  }, [disabled, theme]);

  return (
    <div className="glass relative overflow-hidden rounded-[var(--radius-xl)] p-6 sm:p-8">
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative z-10">
          <span className="eyebrow">3D Stack Constellation</span>
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
            Explore the <span className="grad-text">Tech Universe</span>
          </h2>
          <p className="mb-5 text-sm text-[var(--text-secondary)]">
            Every project, squad, and Codex note is connected by stack. Select any domain node to
            jump straight into its builds.
          </p>

          <div className="flex flex-wrap gap-2">
            {domains.map((dom) => (
              <button
                key={dom.name}
                type="button"
                onMouseEnter={() => setActiveDomain(dom.name)}
                onMouseLeave={() => setActiveDomain(null)}
                onClick={() => navigate(`/explore?cat=${encodeURIComponent(dom.name)}`)}
                className={`chip chip-link transition-transform hover:scale-105 ${
                  activeDomain === dom.name ? 'chip-accent' : ''
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: dom.color }}
                  aria-hidden="true"
                />
                {dom.name}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 sm:h-[300px]"
        >
          {disabled ? (
            <div className="flex h-full items-center justify-center text-xs text-[var(--text-tertiary)]">
              Interactive 3D Constellation
            </div>
          ) : (
            <canvas ref={canvasRef} className="block h-full w-full" />
          )}
          {activeDomain && (
            <div className="mono pointer-events-none absolute bottom-3 left-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-panel)]/90 px-3 py-1 text-xs text-[var(--cyan)] backdrop-blur-md">
              Node: {activeDomain} → Explore
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
