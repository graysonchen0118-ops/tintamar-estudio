'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { makeRenderer, studioEnvironment, visibleLoop, isPhone, reducedMotion, disposeScene, damp, adaptivePixelRatio, photoTexture, trackPointer, contactShadow } from './common';

type V2 = [number, number];

/** The olive branch drawn on the stencil sheet, stroke by stroke, in the order a tattooist would trace it. */
function olivePaths(): THREE.Vector3[][] {
  const stem: V2[] = [[-0.55, -1.32], [-0.18, -0.8], [-0.28, -0.22], [0.04, 0.32], [0.08, 0.86], [0.42, 1.3]];
  const stemCurve = new THREE.CatmullRomCurve3(stem.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  const paths: THREE.Vector3[][] = [stemCurve.getPoints(60)];
  const leafAt = [0.1, 0.19, 0.28, 0.37, 0.46, 0.55, 0.64, 0.73, 0.82, 0.92];
  leafAt.forEach((t, i) => {
    const base = stemCurve.getPointAt(t);
    const tan = stemCurve.getTangentAt(t).normalize();
    const side = i % 2 ? 1 : -1;
    const ang = side * (0.75 + (i % 3) * 0.08);
    const dir = tan.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), ang).normalize();
    const perp = new THREE.Vector3(-dir.y, dir.x, 0);
    const L = 0.46 - Math.abs(t - 0.5) * 0.22;
    const w = L * 0.22;
    const P = (a: number, b: number) => base.clone().addScaledVector(dir, a * L).addScaledVector(perp, b * w);
    const outline = new THREE.CatmullRomCurve3([P(0, 0), P(0.28, 0.95), P(0.66, 0.78), P(1, 0), P(0.66, -0.78), P(0.28, -0.95), P(0.02, -0.04)]);
    paths.push(outline.getPoints(40));
    paths.push(new THREE.CatmullRomCurve3([P(0.05, 0), P(0.5, 0.06), P(0.86, 0)]).getPoints(14));
  });
  // two olives hanging from the stem
  for (const [t, side] of [[0.33, 1], [0.6, -1]] as const) {
    const base = stemCurve.getPointAt(t);
    const tan = stemCurve.getTangentAt(t).normalize();
    const out = new THREE.Vector3(-tan.y, tan.x, 0).multiplyScalar(side);
    const c = base.clone().addScaledVector(out, 0.2).addScaledVector(tan, -0.05);
    const pts: THREE.Vector3[] = [];
    for (let a = 0; a <= 32; a++) {
      const th = (a / 32) * Math.PI * 2 + Math.PI / 2;
      pts.push(new THREE.Vector3(c.x + Math.cos(th) * 0.075, c.y + Math.sin(th) * 0.1, 0));
    }
    paths.push([base.clone().addScaledVector(out, 0.04), c.clone().add(new THREE.Vector3(0, 0.1, 0))]);
    paths.push(pts);
  }
  return paths;
}

function buildPen() {
  const pen = new THREE.Group();
  const metal = new THREE.MeshPhysicalMaterial({ color: '#2b2522', metalness: 0.85, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.2 });
  const grip = new THREE.MeshStandardMaterial({ color: '#171311', roughness: 0.75 });
  const accent = new THREE.MeshPhysicalMaterial({ color: '#d4553a', metalness: 0.4, roughness: 0.3, clearcoat: 0.8 });
  const cart = new THREE.MeshPhysicalMaterial({ color: '#f3efe8', transmission: 0.55, roughness: 0.15, thickness: 0.2, transparent: true, opacity: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ color: '#c9c4bd', metalness: 1, roughness: 0.22 });
  const add = (g: THREE.BufferGeometry, m: THREE.Material, y: number) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.y = y;
    pen.add(mesh);
    return mesh;
  };
  add(new THREE.ConeGeometry(0.012, 0.09, 10), steel, 0.045).rotation.x = Math.PI;
  add(new THREE.CylinderGeometry(0.05, 0.075, 0.34, 24), cart, 0.26);
  add(new THREE.CylinderGeometry(0.105, 0.09, 0.5, 32), grip, 0.68);
  add(new THREE.CylinderGeometry(0.108, 0.108, 0.05, 32), accent, 0.95);
  add(new THREE.CylinderGeometry(0.1, 0.105, 0.95, 32), metal, 1.45);
  add(new THREE.CylinderGeometry(0.06, 0.1, 0.12, 24), metal, 1.98);
  const cable = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 2.02, 0), new THREE.Vector3(0.05, 2.5, 0.1), new THREE.Vector3(0.4, 3.0, 0.5), new THREE.Vector3(1.4, 3.3, 1.2)]);
  pen.add(new THREE.Mesh(new THREE.TubeGeometry(cable, 40, 0.025, 8), grip));
  return pen;
}

export default function HeroScene({ photos, onReady }: { photos: string[]; onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);

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
    const phone = isPhone();
    const still = reducedMotion();
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog('#0f0d0c', 6, 17);
    studioEnvironment(renderer, scene, 0.38);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    camera.position.set(0, 0.2, 6.4);

    scene.add(new THREE.HemisphereLight('#ffe9d6', '#140f0c', 0.55));
    const key = new THREE.DirectionalLight('#ffd9bf', 1.9);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight('#4fb3ab', 14, 12, 1.6);
    rim.position.set(-3.5, 1.5, 1.5);
    scene.add(rim);
    const warm = new THREE.PointLight('#ec8a5e', 10, 10, 1.6);
    warm.position.set(4, -1.5, 2.5);
    scene.add(warm);

    // the wall of finished work, framed and floating at different depths
    const wall = new THREE.Group();
    scene.add(wall);
    const frameMat = new THREE.MeshStandardMaterial({ color: '#1d1916', roughness: 0.55, metalness: 0.2 });
    const slots: [number, number, number, number][] = phone
      ? [[-1.6, 1.9, -4, 0.15], [1.7, 2.3, -5.5, -0.12], [-2.4, -0.4, -6.5, 0.2], [2.6, -0.2, -7, -0.18], [0.2, 3.3, -8, 0.05]]
      : [[-4.6, 1.4, -4.5, 0.22], [-2.2, 2.6, -6.5, 0.1], [-5.6, -1.4, -7.5, 0.28], [-1.4, -2.2, -6, 0.08], [0.7, 2.9, -8.5, -0.05], [4.9, 2.6, -7.2, -0.25], [-7.2, 1.8, -9.5, 0.3], [6.4, -1.9, -9, -0.3]];
    let loaded = 0;
    const frames: { g: THREE.Group; base: THREE.Vector3; ph: number }[] = [];
    slots.forEach(([x, y, z, ry], i) => {
      const id = photos[i % photos.length];
      const g = new THREE.Group();
      const w = 1.5;
      const h = 1.875;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.07), frameMat);
      const tex = photoTexture(id, 420, '4:5', () => {
        loaded++;
        if (loaded === 1) onReady?.();
      });
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.32 }));
      pic.position.z = 0.04;
      g.add(frame, pic);
      g.position.set(x, y, z);
      g.rotation.y = ry;
      wall.add(g);
      frames.push({ g, base: g.position.clone(), ph: i * 1.7 });
    });

    // the stencil sheet with the branch being traced
    const sheet = new THREE.Group();
    scene.add(sheet);
    const paperGeo = new THREE.PlaneGeometry(2.5, 3.3, 24, 24);
    const pos = paperGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin((x + 1.25) * 1.1) * 0.05 + (y > 1.2 ? (y - 1.2) * 0.18 : 0));
    }
    paperGeo.computeVertexNormals();
    const paper = new THREE.Mesh(paperGeo, new THREE.MeshStandardMaterial({ color: '#f2eadd', roughness: 0.92, side: THREE.DoubleSide }));
    sheet.add(paper);
    const under = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 3.36), new THREE.MeshStandardMaterial({ color: '#c9bfae', roughness: 1 }));
    under.position.set(0.05, -0.05, -0.04);
    under.rotation.z = 0.03;
    sheet.add(under);

    const surfaceZ = (x: number, y: number) => Math.sin((x + 1.25) * 1.1) * 0.05 + (y > 1.2 ? (y - 1.2) * 0.18 : 0) + 0.012;
    const inkMat = new THREE.MeshStandardMaterial({ color: '#5a49c7', roughness: 0.55, emissive: '#2a1f7a', emissiveIntensity: 0.35, transparent: true, opacity: 1 });
    const strokes = olivePaths().map((pts) => {
      const p3 = pts.map((p) => new THREE.Vector3(p.x, p.y, surfaceZ(p.x, p.y)));
      const curve = new THREE.CatmullRomCurve3(p3);
      const len = curve.getLength();
      const seg = Math.max(8, Math.round(len * 70));
      const radial = 5;
      const geo = new THREE.TubeGeometry(curve, seg, 0.011, radial, false);
      const mesh = new THREE.Mesh(geo, inkMat);
      geo.setDrawRange(0, 0);
      sheet.add(mesh);
      return { curve, len, geo, seg, per: radial * 6, mesh };
    });
    const totalLen = strokes.reduce((s, x) => s + x.len, 0);

    const pen = buildPen();
    const penHolder = new THREE.Group();
    penHolder.add(pen);
    sheet.add(penHolder);
    pen.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.5, -0.32, 1).normalize());
    const shadow = contactShadow(0.5, 0.5, 0.35);
    shadow.mesh.rotation.x = 0;
    sheet.add(shadow.mesh);

    const layout = () => {
      if (phone) {
        sheet.position.set(0.7, -1.35, -0.6);
        sheet.scale.setScalar(0.58);
      } else {
        sheet.position.set(2.55, -0.15, -0.4);
        sheet.scale.setScalar(0.66);
      }
    };
    layout();
    const baseRot = new THREE.Euler(-0.5, -0.38, 0.1);
    sheet.rotation.copy(baseRot);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.fov = camera.aspect < 0.8 ? 50 : 38;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const adapt = adaptivePixelRatio(renderer, el, phone ? 1.25 : 1.6);
    const pointer = trackPointer();
    const look = { x: 0, y: 0 };

    // drawing state
    let drawn = still ? totalLen : totalLen * 0.32;
    let hold = 0;
    let fade = 1;
    const speed = 2.3;
    let wall0 = performance.now();
    const tip = new THREE.Vector3(0.9, -1.4, 0.4);
    const target = new THREE.Vector3();
    let lift = 0.3;

    const applyDraw = () => {
      let rest = drawn;
      let active: (typeof strokes)[number] | null = null;
      let local = 0;
      for (const s of strokes) {
        if (rest >= s.len) {
          s.geo.setDrawRange(0, s.seg * s.per);
          rest -= s.len;
        } else if (rest > 0) {
          const segs = Math.floor((rest / s.len) * s.seg);
          s.geo.setDrawRange(0, segs * s.per);
          active = s;
          local = rest / s.len;
          rest = 0;
        } else {
          s.geo.setDrawRange(0, 0);
          if (!active) {
            active = s;
            local = 0;
          }
        }
      }
      return { active, local };
    };

    const stop = visibleLoop(el, (t, dt) => {
      adapt();
      // draw, hold, fade and draw again
      // drawing runs on wall-clock time, so a slow device draws in big steps instead of in slow motion
      const now = performance.now();
      const real = Math.min(0.25, (now - wall0) / 1000);
      wall0 = now;
      if (!still) {
        if (drawn < totalLen) {
          drawn = Math.min(totalLen, drawn + real * speed);
        } else {
          hold += real;
          if (hold > 6.5) {
            fade = Math.max(0, fade - real * 1.4);
            inkMat.opacity = fade;
            if (fade === 0) {
              drawn = 0;
              hold = 0;
              fade = 1;
              inkMat.opacity = 1;
            }
          }
        }
      }
      const { active, local } = applyDraw();
      if (active && drawn < totalLen) {
        const p = active.curve.getPointAt(Math.min(1, local));
        target.copy(p);
        const near = tip.distanceTo(target) < 0.06;
        lift = damp(lift, near ? 0 : 0.28, 10, real);
      } else {
        target.set(0.95, -1.45, 0.02);
        lift = damp(lift, 0.35, 3, dt);
      }
      tip.x = damp(tip.x, target.x, 16, real);
      tip.y = damp(tip.y, target.y, 16, real);
      tip.z = damp(tip.z, target.z, 16, real);
      const buzz = lift < 0.02 && !still ? Math.sin(t * 160) * 0.0025 : 0;
      penHolder.position.set(tip.x + buzz, tip.y, tip.z + lift + 0.004);
      shadow.mesh.position.set(tip.x + 0.18 + lift * 0.5, tip.y - 0.12 - lift * 0.3, 0.02);
      shadow.mesh.scale.setScalar(0.8 + lift * 1.6);

      // the camera travels with the scroll and leans with the pointer
      const scroll = Math.min(1.4, window.scrollY / Math.max(1, window.innerHeight));
      look.x = damp(look.x, pointer.p.x, 2.4, dt);
      look.y = damp(look.y, pointer.p.y, 2.4, dt);
      camera.position.x = look.x * 0.45;
      camera.position.y = 0.2 - look.y * 0.3 - scroll * 1.1;
      camera.position.z = 6.4 - scroll * 2.2;
      camera.lookAt(look.x * 0.2, -scroll * 0.9, -2);
      sheet.rotation.x = baseRot.x + scroll * 0.35 + (still ? 0 : Math.sin(t * 0.5) * 0.015);
      sheet.rotation.y = baseRot.y + look.x * 0.08;
      for (const f of frames) {
        f.g.position.y = f.base.y + (still ? 0 : Math.sin(t * 0.4 + f.ph) * 0.08);
        f.g.rotation.x = still ? 0 : Math.sin(t * 0.3 + f.ph) * 0.03;
      }
      renderer.render(scene, camera);
    });

    return () => {
      stop();
      ro.disconnect();
      pointer.stop();
      shadow.dispose();
      disposeScene(scene);
      scene.environment?.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [photos, onReady]);

  return <div ref={host} className="hero-canvas" aria-hidden="true" />;
}
