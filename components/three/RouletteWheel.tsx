'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { makeRenderer, studioEnvironment, visibleLoop, isPhone, reducedMotion, disposeScene, damp, trackPointer } from './common';

export type WheelPrize = { id: string; short: string; color: string };

function labelTexture(text: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d')!;
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  g.fillStyle = '#ffffff';
  g.font = `800 64px ${family}`;
  g.textAlign = 'right';
  g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.35)';
  g.shadowBlur = 8;
  g.fillText(text.toUpperCase(), 496, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/**
 * The prize wheel. `spinTo` is decided before the wheel moves; the animation only lands on it,
 * so what the client sees and what the studio records are always the same prize.
 */
export default function RouletteWheel({ prizes, spinTo, onDone }: { prizes: WheelPrize[]; spinTo: { id: string; n: number } | null; onDone?: (id: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const spinRef = useRef(spinTo);
  spinRef.current = spinTo;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const key = prizes.map((p) => p.id + p.short + p.color).join('|');

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = makeRenderer(canvas, { maxDpr: isPhone() ? 1.5 : 1.8 });
    } catch {
      return;
    }
    el.appendChild(canvas);
    const still = reducedMotion();
    const scene = new THREE.Scene();
    studioEnvironment(renderer, scene, 0.6);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 0.2, 8.4);
    scene.add(new THREE.HemisphereLight('#fff0e2', '#140f0c', 0.6));
    const key = new THREE.DirectionalLight('#ffe3cf', 2.3);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight('#4fb3ab', 18, 14, 1.5);
    rim.position.set(-4, 2, 2);
    scene.add(rim);

    const stand = new THREE.Group();
    scene.add(stand);
    const wheel = new THREE.Group();
    stand.add(wheel);
    const n = prizes.length;
    const seg = (Math.PI * 2) / n;
    const R = 2;
    const depth = 0.22;
    const wedges: THREE.MeshPhysicalMaterial[] = [];
    prizes.forEach((p, i) => {
      const a0 = i * seg;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, R, a0, a0 + seg, false);
      shape.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 2, curveSegments: 24 });
      const mat = new THREE.MeshPhysicalMaterial({ color: p.color, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, emissive: p.color, emissiveIntensity: 0 });
      wedges.push(mat);
      wheel.add(new THREE.Mesh(geo, mat));
      const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: labelTexture(p.short), transparent: true, depthWrite: false }));
      const mid = a0 + seg / 2;
      lbl.position.set(Math.cos(mid) * 1.02, Math.sin(mid) * 1.02, depth + 0.045);
      lbl.rotation.z = mid;
      wheel.add(lbl);
    });
    const brass = new THREE.MeshPhysicalMaterial({ color: '#c79a45', metalness: 0.9, roughness: 0.25, clearcoat: 0.6 });
    const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.085, 16, 96), brass);
    rimMesh.position.z = depth / 2;
    wheel.add(rimMesh);
    for (let i = 0; i < n; i++) {
      const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 12), brass);
      peg.rotation.x = Math.PI / 2;
      peg.position.set(Math.cos(i * seg) * (R - 0.1), Math.sin(i * seg) * (R - 0.1), depth + 0.1);
      wheel.add(peg);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.2, 40), new THREE.MeshPhysicalMaterial({ color: '#171311', roughness: 0.35, clearcoat: 1 }));
    hub.rotation.x = Math.PI / 2;
    hub.position.z = depth + 0.1;
    wheel.add(hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 32), brass);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = depth + 0.22;
    wheel.add(cap);
    const back = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.12, R + 0.12, 0.14, 64), new THREE.MeshStandardMaterial({ color: '#1c1714', roughness: 0.6 }));
    back.rotation.x = Math.PI / 2;
    back.position.z = -0.08;
    stand.add(back);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.6, 0.22), new THREE.MeshStandardMaterial({ color: '#241e1a', roughness: 0.5 }));
    post.position.set(0, -2.6, -0.2);
    stand.add(post);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.18, 48), new THREE.MeshStandardMaterial({ color: '#241e1a', roughness: 0.5 }));
    base.position.set(0, -3.9, -0.2);
    stand.add(base);

    // the flapper at the top
    const flapper = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.46, 3), new THREE.MeshPhysicalMaterial({ color: '#d4553a', roughness: 0.3, clearcoat: 1 }));
    cone.rotation.z = Math.PI;
    cone.position.y = -0.18;
    flapper.add(cone);
    flapper.position.set(0, R + 0.28, depth + 0.22);
    stand.add(flapper);

    // confetti in the studio colours
    const confettiColors = ['#d4553a', '#ec8a5e', '#4fb3ab', '#f2eadd', '#c79a45'];
    const confetti: { m: THREE.Mesh; v: THREE.Vector3; r: THREE.Vector3 }[] = [];
    const cGeo = new THREE.PlaneGeometry(0.09, 0.05);
    for (let i = 0; i < 70; i++) {
      const m = new THREE.Mesh(cGeo, new THREE.MeshBasicMaterial({ color: confettiColors[i % confettiColors.length], side: THREE.DoubleSide }));
      m.visible = false;
      scene.add(m);
      confetti.push({ m, v: new THREE.Vector3(), r: new THREE.Vector3() });
    }
    cGeo.userData.shared = false;
    const burst = () => {
      for (const c of confetti) {
        c.m.visible = true;
        c.m.position.set(0, R + 0.3, 0.6);
        c.v.set((Math.random() - 0.5) * 6, 3 + Math.random() * 4, (Math.random() - 0.2) * 3);
        c.r.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      }
    };

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.position.z = camera.aspect < 0.9 ? 9.6 : 8.4;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const pointer = trackPointer();
    const look = { x: 0, y: 0 };

    let angle = Math.PI / 2 - seg / 2;
    let anim: { from: number; to: number; t: number; dur: number; id: string; t0: number } | null = null;
    let lastSpin = 0;
    let flap = 0;
    let lastPeg = Math.floor(angle / seg);
    let glow: number | null = null;
    const ease = (x: number) => 1 - Math.pow(1 - x, 4);

    const stop = visibleLoop(el, (t, dt) => {
      const req = spinRef.current;
      if (req && req.n !== lastSpin) {
        lastSpin = req.n;
        const i = prizes.findIndex((p) => p.id === req.id);
        if (i >= 0) {
          const mid = i * seg + seg / 2 + (Math.random() - 0.5) * seg * 0.55;
          const want = Math.PI / 2 - mid;
          const current = angle % (Math.PI * 2);
          let delta = (want - current) % (Math.PI * 2);
          if (delta < 0) delta += Math.PI * 2;
          anim = { from: angle, to: angle + delta + Math.PI * 2 * (still ? 0 : 5), t: 0, dur: still ? 0.4 : 5.2, id: req.id, t0: performance.now() };
          glow = null;
        }
      }
      if (anim) {
        // wall-clock time: a slow phone shows fewer frames of the spin, never a longer spin
        anim.t = Math.min(1, (performance.now() - anim.t0) / 1000 / anim.dur);
        angle = anim.from + (anim.to - anim.from) * ease(anim.t);
        if (anim.t >= 1) {
          const id = anim.id;
          glow = prizes.findIndex((p) => p.id === id);
          anim = null;
          if (!still) burst();
          doneRef.current?.(id);
        }
      } else if (!still && glow === null) {
        angle += dt * 0.12;
      }
      wheel.rotation.z = angle;
      // the flapper kicks each time a peg passes under it
      const peg = Math.floor((angle - Math.PI / 2) / seg);
      if (peg !== lastPeg) {
        lastPeg = peg;
        flap = 1;
      }
      flap = damp(flap, 0, 12, dt);
      flapper.rotation.z = flap * 0.45;
      wedges.forEach((m, i) => (m.emissiveIntensity = glow === i ? 0.35 + Math.sin(t * 5) * 0.15 : 0));
      for (const c of confetti) {
        if (!c.m.visible) continue;
        c.v.y -= 9 * dt;
        c.v.multiplyScalar(0.985);
        c.m.position.addScaledVector(c.v, dt);
        c.m.rotation.x += c.r.x * dt;
        c.m.rotation.y += c.r.y * dt;
        if (c.m.position.y < -4.5) c.m.visible = false;
      }
      look.x = damp(look.x, pointer.p.x, 2.5, dt);
      look.y = damp(look.y, pointer.p.y, 2.5, dt);
      stand.rotation.y = 0.16 + look.x * 0.18;
      stand.rotation.x = -0.08 + look.y * 0.08;
      stand.position.y = 0.65;
      renderer.render(scene, camera);
    });

    return () => {
      stop();
      ro.disconnect();
      pointer.stop();
      disposeScene(scene);
      scene.environment?.dispose();
      renderer.dispose();
      canvas.remove();
    };
    // the wheel is rebuilt only when the prizes themselves change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} />;
}
