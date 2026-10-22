'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { makeRenderer, studioEnvironment, visibleLoop, isPhone, reducedMotion, disposeScene, damp } from './common';

export type BoardData = { artists: { id: string; color: string }[]; days: string[]; hours: number[][]; today: number; flash?: { a: number; d: number; n: number } | null };

/**
 * The studio week as blocks: one row per artist, one column per day, height = hours booked.
 * When a booking lands, its block grows in front of the manager.
 */
export default function WeekBoard({ data }: { data: BoardData }) {
  const host = useRef<HTMLDivElement>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const shape = `${data.artists.map((a) => a.id).join(',')}|${data.days.length}`;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = makeRenderer(canvas, { maxDpr: isPhone() ? 1.25 : 1.6 });
    } catch {
      return;
    }
    el.appendChild(canvas);
    const still = reducedMotion();
    const scene = new THREE.Scene();
    studioEnvironment(renderer, scene, 0.45);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    scene.add(new THREE.HemisphereLight('#fff1e4', '#140f0c', 0.7));
    const keyL = new THREE.DirectionalLight('#ffe2cc', 2);
    keyL.position.set(4, 8, 6);
    scene.add(keyL);

    const { artists, days } = dataRef.current;
    const nA = artists.length;
    const nD = days.length;
    const gap = 1.05;
    const board = new THREE.Group();
    scene.add(board);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(nD * gap + 0.5, 0.12, nA * gap + 0.5), new THREE.MeshPhysicalMaterial({ color: '#2a2420', roughness: 0.5, clearcoat: 0.4 }));
    plate.position.y = -0.06;
    board.add(plate);
    const todayStrip = new THREE.Mesh(new THREE.BoxGeometry(gap * 0.96, 0.02, nA * gap + 0.3), new THREE.MeshBasicMaterial({ color: '#d4553a', transparent: true, opacity: 0.35 }));
    todayStrip.position.y = 0.011;
    board.add(todayStrip);
    const cells: { mesh: THREE.Mesh; h: number }[][] = [];
    for (let a = 0; a < nA; a++) {
      const row: { mesh: THREE.Mesh; h: number }[] = [];
      const mat = new THREE.MeshPhysicalMaterial({ color: artists[a].color, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.2 });
      for (let d = 0; d < nD; d++) {
        const geo = new THREE.BoxGeometry(0.78, 1, 0.78);
        geo.translate(0, 0.5, 0);
        const m = new THREE.Mesh(geo, mat);
        m.position.set((d - (nD - 1) / 2) * gap, 0, (a - (nA - 1) / 2) * gap);
        m.scale.y = 0.001;
        board.add(m);
        row.push({ mesh: m, h: 0.001 });
      }
      cells.push(row);
    }

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      const far = camera.aspect < 1.2 ? 13 : 10.5;
      camera.position.set(0, far * 0.62, far);
      camera.lookAt(0, 0.6, 0);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const pointer = { x: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    };
    el.addEventListener('pointermove', onMove);
    let look = 0;
    let lastFlash = 0;
    let flashT = 0;
    let flashCell: THREE.Mesh | null = null;

    const stop = visibleLoop(el, (t, dt) => {
      const dnow = dataRef.current;
      todayStrip.position.x = (dnow.today - (nD - 1) / 2) * gap;
      todayStrip.visible = dnow.today >= 0;
      if (dnow.flash && dnow.flash.n !== lastFlash) {
        lastFlash = dnow.flash.n;
        flashCell = cells[dnow.flash.a]?.[dnow.flash.d]?.mesh ?? null;
        flashT = 1;
      }
      flashT = Math.max(0, flashT - dt * 0.8);
      for (let a = 0; a < nA; a++) {
        for (let d = 0; d < nD; d++) {
          const c = cells[a][d];
          const target = Math.max(0.001, (dnow.hours[a]?.[d] ?? 0) * 0.42);
          c.h = still ? target : damp(c.h, target, 4, dt);
          c.mesh.scale.y = c.h;
          const lift = flashCell === c.mesh ? Math.sin(flashT * Math.PI) * 0.5 : 0;
          c.mesh.position.y = lift;
        }
      }
      look = damp(look, pointer.x, 3, dt);
      board.rotation.y = -0.32 + look * 0.25 + (still ? 0 : Math.sin(t * 0.25) * 0.04);
      renderer.render(scene, camera);
    });

    return () => {
      stop();
      ro.disconnect();
      el.removeEventListener('pointermove', onMove);
      disposeScene(scene);
      scene.environment?.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [shape]);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} />;
}
