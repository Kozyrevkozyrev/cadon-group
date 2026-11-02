// The CADON mark in 3D: the symbol cut into eight pieces, one per company.
// It sits in the [data-mark] slots of the page and flies between them as the page scrolls:
// whole in the hero, apart in "Eight companies. One group.", gone over the map and the value chain, whole again by the contact form.

import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import mark from './mark-data.js';

const root = document.documentElement;
const canvas = document.querySelector('.mark-canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function fail() {
  root.classList.add('no-webgl');
  window.cadonSceneReady = true;
  window.dispatchEvent(new Event('cadon:scene-ready'));
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch {
  fail();
}

if (renderer) start();

function start() {
  root.classList.add('has-webgl');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 10, 4000);
  camera.position.set(0, 0, 1000);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-300, 400, 600);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0xdfe8ff, .35));

  // Geometry: each piece extruded from its outline, coloured along x like the logo's gradient
  const from = new THREE.Color('#2f58ff');
  const to = new THREE.Color('#5fb2ff');
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true, metalness: .08, roughness: .3, clearcoat: .7, clearcoatRoughness: .12, envMapIntensity: .75
  });
  const DEPTH = 16;

  const group = new THREE.Group();
  const spin = new THREE.Group();
  spin.add(group);
  scene.add(spin);

  const pieces = mark.pieces.map((piece, i) => {
    const shapes = piece.polys.map(([outer, ...holes]) => {
      const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, -y)));
      holes.forEach(h => shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, -y)))));
      return shape;
    });
    const geometry = new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.4, bevelSegments: 5 });
    geometry.translate(0, 0, -DEPTH / 2);
    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let v = 0; v < pos.count; v++) {
      c.copy(from).lerp(to, THREE.MathUtils.clamp((pos.getX(v) + mark.radius) / (mark.radius * 2), 0, 1));
      colors.set([c.r, c.g, c.b], v * 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    // where this piece goes when the mark comes apart
    const [dx, dy] = piece.dir;
    const seed = Math.sin((i + 1) * 12.9898) * 43758.5453;
    const r = seed - Math.floor(seed);
    return {
      mesh,
      out: new THREE.Vector3(dx * (30 + r * 14), -dy * (30 + r * 14), (r - .5) * 70),
      turn: new THREE.Euler((r - .5) * 1.4, (.5 - r) * 1.8, (r - .5) * .9),
      phase: r * Math.PI * 2
    };
  });

  // Slots
  const slots = [...document.querySelectorAll('[data-mark]')].map(el => ({
    el,
    size: Number(el.dataset.markSize || .9),
    explode: Number(el.dataset.markExplode || 0),
    show: el.hasAttribute('data-mark-hide') ? 0 : 1
  }));

  let width = 0, height = 0, unitsPerPx = 1;
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    unitsPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / height;
  }
  window.addEventListener('resize', resize);
  resize();

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => {
    pointer.tx = (e.clientX / width) * 2 - 1;
    pointer.ty = (e.clientY / height) * 2 - 1;
  }, { passive: true });

  const smooth = t => t * t * (3 - 2 * t);
  // on a phone the column is too narrow to fly past the text, and with reduced motion nothing should fly at all
  const pinnedToSlots = () => reduceMotion.matches || width <= 720;
  function measure(slot) {
    const r = slot.el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, d: Math.min(r.width, r.height || r.width) * slot.size, explode: slot.explode, show: slot.show, rect: r };
  }

  // the state the mark should be in at this scroll position: between the two slots around the middle of the screen
  function target() {
    const states = slots.map(measure).filter(st => st.rect.width > 0);
    const mid = height / 2;
    if (pinnedToSlots()) {
      // no flying: the mark sits in whichever slot is most in view and fades as that slot leaves the screen
      let best = null, bestVis = 0;
      for (const st of states) {
        if (!st.show) continue;
        const vis = Math.max(0, Math.min(st.rect.bottom, height) - Math.max(st.rect.top, 0)) / Math.min(st.rect.height, height);
        if (vis > bestVis) { best = st; bestVis = vis; }
      }
      return best ? { ...best, show: smooth(Math.min(1, bestVis * 1.25)) } : { ...states[0], show: 0 };
    }
    if (mid <= states[0].y) return states[0];
    for (let i = 0; i < states.length - 1; i++) {
      const a = states[i], b = states[i + 1];
      if (mid >= a.y && mid <= b.y) {
        const t = smooth((mid - a.y) / (b.y - a.y || 1));
        const lerp = (p, q) => p + (q - p) * t;
        return { x: lerp(a.x, b.x), y: lerp(a.y, b.y), d: lerp(a.d, b.d), explode: lerp(a.explode, b.explode), show: lerp(a.show, b.show) };
      }
    }
    return states[states.length - 1];
  }

  const now = { x: 0, y: 0, d: 0, explode: 0, show: 0 };
  let first = true;
  let entrance = 0;
  let entranceStart = null;
  const clock = new THREE.Clock();

  function frame() {
    const t = clock.getElapsedTime();
    const goal = target();
    const still = reduceMotion.matches;
    const k = first || still ? 1 : .12;
    first = false;
    for (const key of ['x', 'y', 'd', 'explode', 'show']) {
      const glued = (key === 'x' || key === 'y' || key === 'd') && pinnedToSlots();
      now[key] += (goal[key] - now[key]) * (glued ? 1 : k);
    }

    // entrance after the loader: the pieces fly in and lock together
    if (root.classList.contains('is-loaded') && entranceStart === null) entranceStart = t;
    entrance = entranceStart === null ? 0 : still ? 1 : Math.min(1, (t - entranceStart) / 1.8);
    const settle = 1 - Math.pow(1 - entrance, 4);
    const apart = Math.max(now.explode, 1 - settle);

    pointer.x += (pointer.tx - pointer.x) * .06;
    pointer.y += (pointer.ty - pointer.y) * .06;

    const scale = (now.d * unitsPerPx) / (mark.radius * 2) * (.25 + .75 * settle);
    spin.position.set((now.x - width / 2) * unitsPerPx, -(now.y - height / 2) * unitsPerPx, 0);
    spin.scale.setScalar(Math.max(scale * now.show, .0001));
    spin.visible = now.show > .02 && entrance > 0;

    const sway = still ? 0 : 1;
    group.rotation.x = sway * (pointer.y * .35 + Math.sin(t * .6) * .06);
    group.rotation.y = sway * (pointer.x * .5 + Math.sin(t * .4) * .14) + (1 - settle) * -1.2;
    spin.rotation.z = sway * now.explode * t * .12;

    pieces.forEach(p => {
      const drift = sway * Math.sin(t * .9 + p.phase) * 4 * now.explode;
      p.mesh.position.set(p.out.x * apart + drift, p.out.y * apart + drift * .6, p.out.z * apart);
      p.mesh.rotation.set(p.turn.x * apart, p.turn.y * apart, p.turn.z * apart);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  // compile once before the loader lifts so the first frames don't stutter
  renderer.compile(scene, camera);
  requestAnimationFrame(frame);
  window.cadonSceneReady = true;
  window.dispatchEvent(new Event('cadon:scene-ready'));
}
