'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { ZoneId } from '@/lib/mock/studio';
import { makeRenderer, studioEnvironment, visibleLoop, isPhone, reducedMotion, disposeScene, damp } from './common';

type Side = 'izquierdo' | 'derecho' | null;
type Patch = { zone: ZoneId; side: Side; mesh: THREE.Mesh };

/**
 * A clay figure to point at where the tattoo goes. The zone is drawn on the body,
 * and the figure turns to show it, so "costillas" or "gemelo" is never a guess.
 */
export default function BodyPicker({ zone, side, sizeCm, onPick }: { zone: ZoneId | null; side: Side; sizeCm: number; onPick: (z: ZoneId, s: Side) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const sel = useRef({ zone, side, sizeCm });
  sel.current = { zone, side, sizeCm };
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = makeRenderer(canvas, { maxDpr: isPhone() ? 1.5 : 2 });
    } catch {
      return;
    }
    el.appendChild(canvas);
    const still = reducedMotion();
    const scene = new THREE.Scene();
    studioEnvironment(renderer, scene, 0.5);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    camera.position.set(0, 0.3, 7.6);
    camera.lookAt(0, 0.22, 0);
    scene.add(new THREE.HemisphereLight('#fff1e4', '#1a1411', 0.7));
    const key = new THREE.DirectionalLight('#ffe2cc', 2.2);
    key.position.set(2.5, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#4fb3ab', 1.6);
    rim.position.set(-3, 2, -3);
    scene.add(rim);

    const fig = new THREE.Group();
    scene.add(fig);
    const clay = new THREE.MeshPhysicalMaterial({ color: '#c9b6a3', roughness: 0.62, sheen: 0.6, sheenColor: new THREE.Color('#f5e1cf'), clearcoat: 0.15 });
    const part = (g: THREE.BufferGeometry, x: number, y: number, z = 0, rz = 0, sx = 1, sz = 1) => {
      const m = new THREE.Mesh(g, clay);
      m.position.set(x, y, z);
      m.rotation.z = rz;
      m.scale.set(sx, 1, sz);
      fig.add(m);
      return m;
    };
    const torso = part(new THREE.CapsuleGeometry(0.34, 0.6, 8, 24), 0, 0.78, 0, 0, 1, 0.62);
    part(new THREE.SphereGeometry(0.31, 24, 16), 0, 0.26, 0, 0, 1.06, 0.66).scale.y = 0.62;
    part(new THREE.CylinderGeometry(0.095, 0.11, 0.2, 16), 0, 1.24);
    part(new THREE.SphereGeometry(0.21, 24, 18), 0, 1.5).scale.y = 1.14;
    for (const sx of [-1, 1]) {
      part(new THREE.SphereGeometry(0.135, 18, 14), sx * 0.42, 1.08);
      part(new THREE.CapsuleGeometry(0.1, 0.4, 6, 16), sx * 0.5, 0.79, 0, sx * 0.1);
      part(new THREE.CapsuleGeometry(0.085, 0.38, 6, 16), sx * 0.555, 0.33, 0, sx * 0.05);
      part(new THREE.CapsuleGeometry(0.07, 0.1, 6, 12), sx * 0.575, -0.02, 0, 0, 0.72);
      part(new THREE.CapsuleGeometry(0.15, 0.52, 6, 18), sx * 0.17, -0.22);
      part(new THREE.CapsuleGeometry(0.112, 0.48, 6, 16), sx * 0.17, -0.86);
      const foot = part(new THREE.CapsuleGeometry(0.07, 0.16, 6, 12), sx * 0.17, -1.2, 0.07);
      foot.rotation.x = Math.PI / 2;
    }
    torso.castShadow = false;

    // zone patches: shells laid on the body, invisible until hovered or chosen
    const patches: Patch[] = [];
    const accent = new THREE.Color('#d4553a');
    const hoverC = new THREE.Color('#4fb3ab');
    const shell = (zone: ZoneId, side: Side, geo: THREE.BufferGeometry, x: number, y: number, rz = 0, parentScaleZ = 1) => {
      const mat = new THREE.MeshPhysicalMaterial({ color: accent, transparent: true, opacity: 0, roughness: 0.4, emissive: accent, emissiveIntensity: 0, side: THREE.DoubleSide, depthWrite: false, clearcoat: 0.6 });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, 0);
      m.rotation.z = rz;
      m.scale.z = parentScaleZ;
      m.renderOrder = 2;
      fig.add(m);
      patches.push({ zone, side, mesh: m });
    };
    const ring = (r: number, h: number, a0 = 0, al = Math.PI * 2) => new THREE.CylinderGeometry(r, r, h, 32, 1, true, a0, al);
    // the figure faces +z, its right side is at -x
    for (const [sx, sd] of [[-1, 'derecho'], [1, 'izquierdo']] as const) {
      shell('antebrazo', sd, ring(0.1, 0.3), sx * 0.555, 0.36, sx * 0.05);
      shell('muneca', sd, ring(0.09, 0.07), sx * 0.565, 0.11, sx * 0.05);
      shell('mano', sd, ring(0.078, 0.14), sx * 0.575, -0.03, 0);
      shell('brazo', sd, ring(0.118, 0.32), sx * 0.5, 0.8, sx * 0.1);
      const cap = new THREE.SphereGeometry(0.148, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.2);
      shell('hombro', sd, cap, sx * 0.42, 1.1);
      shell('clavicula', sd, ring(0.352, 0.09, sx > 0 ? 0.25 : -0.95, 0.7), 0, 1.06, 0, 0.62);
      shell('costillas', sd, ring(0.352, 0.42, sx > 0 ? 1.15 : -2.05, 0.9), 0, 0.66, 0, 0.62);
      shell('muslo', sd, ring(0.158, 0.44), sx * 0.17, -0.2);
      shell('gemelo', sd, ring(0.12, 0.32, Math.PI - 1.4, 2.8), sx * 0.17, -0.82);
      shell('tobillo', sd, ring(0.082, 0.09), sx * 0.17, -1.13);
    }
    shell('pecho', null, ring(0.355, 0.32, -0.75, 1.5), 0, 0.9, 0, 0.62);
    shell('espalda', null, ring(0.355, 0.78, Math.PI - 1.15, 2.3), 0, 0.72, 0, 0.62);
    shell('nuca', null, ring(0.112, 0.16, Math.PI - 1.35, 2.7), 0, 1.25);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1, 48), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.3;
    scene.add(floor);

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.position.z = camera.aspect < 0.7 ? 9 : 7.6;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // pointer: hover, click, and drag to turn
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let hovered: Patch | null = null;
    let drag: { x: number; rot: number; moved: boolean } | null = null;
    let manual = 0;
    let manualUntil = 0;
    const hit = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const res = ray.intersectObjects(patches.map((p) => p.mesh), false);
      return res.length ? patches.find((p) => p.mesh === res[0].object) ?? null : null;
    };
    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, rot: manual, moved: false };
    };
    const move = (e: PointerEvent) => {
      if (drag && e.buttons) {
        const dx = e.clientX - drag.x;
        if (Math.abs(dx) > 4) drag.moved = true;
        if (drag.moved) {
          manual = drag.rot + dx * 0.012;
          manualUntil = performance.now() + 4000;
        }
      }
      hovered = hit(e);
      canvas.style.cursor = hovered ? 'pointer' : drag?.moved ? 'grabbing' : 'grab';
    };
    const up = (e: PointerEvent) => {
      if (drag && !drag.moved) {
        const p = hit(e);
        if (p) pickRef.current(p.zone, p.side);
      }
      drag = null;
    };
    const leave = () => {
      hovered = null;
      drag = null;
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', leave);

    const facing = (z: ZoneId | null, s: Side) => {
      if (!z) return 0;
      if (z === 'espalda' || z === 'nuca' || z === 'gemelo') return Math.PI;
      if (z === 'costillas') return s === 'derecho' ? Math.PI / 2 : -Math.PI / 2;
      if (s === 'derecho') return 0.45;
      if (s === 'izquierdo') return -0.45;
      return 0;
    };
    let rot = 0;
    let pulse = 0;
    let lastKey = '';
    const stop = visibleLoop(el, (t, dt) => {
      const { zone: z, side: s, sizeCm } = sel.current;
      const k = `${z}${s}`;
      if (k !== lastKey) {
        lastKey = k;
        pulse = 1;
        manualUntil = 0;
      }
      pulse = Math.max(0, pulse - dt * 1.4);
      const auto = performance.now() < manualUntil ? manual : facing(z, s) + (still ? 0 : Math.sin(t * 0.6) * 0.08);
      if (performance.now() >= manualUntil) manual = auto;
      rot = damp(rot, auto, 5, dt);
      fig.rotation.y = rot;
      for (const p of patches) {
        const mat = p.mesh.material as THREE.MeshPhysicalMaterial;
        const chosen = p.zone === z && (p.side === s || p.side === null || s === null);
        const hov = hovered === p;
        const strength = Math.min(1, 0.55 + sizeCm / 40);
        const target = chosen ? 0.55 + strength * 0.35 : hov ? 0.5 : 0;
        mat.opacity = damp(mat.opacity, target, 10, dt);
        mat.color.copy(chosen ? accent : hoverC);
        mat.emissive.copy(chosen ? accent : hoverC);
        mat.emissiveIntensity = chosen ? 0.35 + pulse * 0.9 + (still ? 0 : Math.sin(t * 3) * 0.08) : hov ? 0.25 : 0;
        const sc = chosen ? 1 + pulse * 0.06 : 1;
        p.mesh.scale.x = sc;
        p.mesh.scale.y = sc;
      }
      renderer.render(scene, camera);
    });

    return () => {
      stop();
      ro.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointerleave', leave);
      disposeScene(scene);
      scene.environment?.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} />;
}
