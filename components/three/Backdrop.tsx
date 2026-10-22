'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { makeRenderer, visibleLoop, isPhone, reducedMotion, disposeScene, damp, adaptivePixelRatio, photoTexture, trackPointer } from './common';

/** Framed works hung at different depths behind a page title, with a few traced lines between them. */
export default function Backdrop({ photos, accent = '#d4553a' }: { photos: string[]; accent?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const key = photos.join(',');

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = makeRenderer(canvas, { maxDpr: isPhone() ? 1.2 : 1.5 });
    } catch {
      return;
    }
    el.appendChild(canvas);
    const phone = isPhone();
    const still = reducedMotion();
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#0f0d0c', 5, 15);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 6);

    const ids = key.split(',');
    const slots: [number, number, number, number, number][] = phone
      ? [[1.6, 0.6, -2, -0.25, 1.3], [-1.2, 1.3, -4.5, 0.2, 1.2], [2.4, -1.2, -5.5, -0.3, 1.1]]
      : [[3.6, 0.4, -1.5, -0.32, 1.5], [1.4, 1.5, -4, -0.12, 1.25], [5.6, 1.9, -5.5, -0.4, 1.3], [2.8, -1.7, -3.2, -0.2, 1.1], [-2.6, 2.2, -7.5, 0.18, 1.4], [6.2, -1.5, -7, -0.35, 1.2]];
    const frameMat = new THREE.MeshBasicMaterial({ color: '#211c19' });
    const items: { g: THREE.Group; y: number; z: number; ph: number }[] = [];
    slots.forEach(([x, y, z, ry, s], i) => {
      const g = new THREE.Group();
      const tex = photoTexture(ids[i % ids.length], 360, '4:5');
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 2.0), frameMat);
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.875), new THREE.MeshBasicMaterial({ map: tex }));
      pic.position.z = 0.01;
      g.add(frame, pic);
      g.position.set(x, y, z);
      g.rotation.y = ry;
      g.scale.setScalar(s);
      scene.add(g);
      items.push({ g, y, z, ph: i * 1.3 });
    });

    // traced lines, like stencil marks drifting between the frames
    const lineMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.55 });
    const lines: THREE.Mesh[] = [];
    for (let i = 0; i < (phone ? 2 : 4); i++) {
      const pts: THREE.Vector3[] = [];
      const ox = (phone ? 0.5 : 1.5) + i * 1.3;
      const oy = -1.8 + i * 1.1;
      for (let k = 0; k < 7; k++) pts.push(new THREE.Vector3(ox + Math.sin(k * 0.9 + i) * 0.8 + k * 0.25, oy + Math.cos(k * 1.1 + i) * 0.5, -1 - i * 1.2));
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.012, 5), lineMat);
      scene.add(mesh);
      lines.push(mesh);
    }

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / Math.max(1, el.clientHeight);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const adapt = adaptivePixelRatio(renderer, el, phone ? 1.2 : 1.5);
    const pointer = trackPointer();
    const look = { x: 0, y: 0 };

    const stop = visibleLoop(el, (t, dt) => {
      adapt();
      const scroll = Math.min(1, window.scrollY / 600);
      look.x = damp(look.x, pointer.p.x, 2.2, dt);
      look.y = damp(look.y, pointer.p.y, 2.2, dt);
      camera.position.x = look.x * 0.5;
      camera.position.y = -look.y * 0.3 - scroll * 0.8;
      camera.position.z = 6 - scroll * 1.2;
      camera.lookAt(0.5, -scroll * 0.6, -3);
      for (const it of items) {
        it.g.position.y = it.y + (still ? 0 : Math.sin(t * 0.35 + it.ph) * 0.1) + scroll * (it.z + 8) * 0.12;
      }
      lines.forEach((l, i) => (l.rotation.z = still ? 0 : Math.sin(t * 0.2 + i) * 0.05));
      renderer.render(scene, camera);
    });

    return () => {
      stop();
      ro.disconnect();
      pointer.stop();
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
    };
  }, [key, accent]);

  return <div ref={host} className="phead-canvas" aria-hidden="true" />;
}
