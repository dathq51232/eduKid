// Sân khấu 3D dùng chung cho Xưởng bài giảng (soạn) và trình chiếu: dựng sa bàn, đồ vật, hiệu ứng, đường nối,
// chọn / kéo đồ vật, bay camera giữa các cảnh, ghim điểm chạm. Chạy hoàn toàn trên trình duyệt.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ASSET_BY_ID, type Part } from './assets';
import type { BaseType, Lesson3D, Link3D, Obj3D } from './types';

type Node = { root: THREE.Group; body: THREE.Group; key: string; pts?: THREE.Points; seeds?: number[][]; ang: number; rad: number; t0: number };
export type Runtime = Record<string, { on?: boolean; speed?: number; split?: boolean; hidden?: boolean }>;
export type EngineEvents = {
  onSelect?: (id: string | null) => void;
  onPick?: (id: string) => void;
  onPlace?: (type: string, x: number, z: number) => void;
  onMoved?: (id: string, x: number, z: number) => void;
};

const BASES: Record<BaseType, { top: string; side: string; bg: string }> = {
  grass: { top: '#6fa64e', side: '#8a5a3b', bg: 'linear-gradient(#bfe3ff, #eef8ff 72%)' },
  desk: { top: '#f1e3c6', side: '#b98a55', bg: 'linear-gradient(#f7f3ea, #e9eef7)' },
  space: { top: '#3a4466', side: '#232a44', bg: 'radial-gradient(circle at 30% 20%, #26346a, #090d1f 70%)' },
  water: { top: '#3aa0d8', side: '#1b6fa8', bg: 'linear-gradient(#bfe3ff, #eef8ff 72%)' },
  road: { top: '#9ca3af', side: '#6b7280', bg: 'linear-gradient(#cfe8ff, #f1f7ff 72%)' },
};
const r1 = (v: number) => Math.round(v * 10) / 10;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

export class Stage3D {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  readonly controls: OrbitControls;
  private el: HTMLElement;
  private ov: HTMLElement;
  private nodes = new Map<string, Node>();
  private lesson: Lesson3D | null = null;
  private runtime: Runtime = {};
  private slab = new THREE.Group();
  private linkGroup = new THREE.Group();
  private stars: THREE.Points;
  private selB = new THREE.Box3();
  private selBox = new THREE.Box3Helper(this.selB, 0xf59e0b);
  private sel: string | null = null;
  private ghost: THREE.Group | null = null;
  private placing: string | null = null;
  private drag: { id: string; dx: number; dz: number } | null = null;
  private down: [number, number] | null = null;
  private fly: { p0: THREE.Vector3; t0: THREE.Vector3; p1: THREE.Vector3; t1: THREE.Vector3; u: number } | null = null;
  private raf = 0;
  private last = performance.now();
  private ro: ResizeObserver;
  private ray = new THREE.Raycaster();
  private ptr = new THREE.Vector2();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private pins = new Map<string, HTMLButtonElement>();
  private linkLabels = new Map<string, HTMLSpanElement>();
  private dotTex: THREE.Texture;
  /** null = đang soạn; số = cảnh đang trình chiếu (ẩn đồ vật xuất hiện ở cảnh sau) */
  playScene: number | null = null;
  quizMode = false;
  snap = false;
  ev: EngineEvents;

  constructor(el: HTMLElement, ev: EngineEvents = {}) {
    this.el = el; this.ev = ev;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 's3d-canvas';
    el.prepend(this.renderer.domElement);
    this.ov = document.createElement('div'); this.ov.className = 's3d-ov'; el.appendChild(this.ov);
    this.camera.position.set(13, 9, 15);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.5, 0); this.controls.enableDamping = true; this.controls.maxPolarAngle = 1.42; this.controls.minDistance = 4; this.controls.maxDistance = 42;
    this.scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x6b7f5a, 1.1));
    const dl = new THREE.DirectionalLight(0xfff2dc, 1.5); dl.position.set(8, 14, 6); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024);
    Object.assign(dl.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12 }); this.scene.add(dl);
    this.scene.add(this.slab, this.linkGroup);
    this.selBox.visible = false; this.scene.add(this.selBox);
    const sg = new THREE.BufferGeometry(); const a: number[] = [];
    for (let i = 0; i < 500; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 30); if (v.y < -5) v.y = -v.y; a.push(v.x, v.y, v.z); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.35 }));
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d')!;
    const rg = g.createRadialGradient(16, 16, 1, 16, 16, 15); rg.addColorStop(0, '#fff'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 32, 32);
    this.dotTex = new THREE.CanvasTexture(c);
    const cv = this.renderer.domElement;
    cv.addEventListener('pointermove', this.onMove);
    cv.addEventListener('pointerdown', this.onDown);
    cv.addEventListener('pointerup', this.onUp);
    el.addEventListener('dragover', this.onDragOver);
    el.addEventListener('drop', this.onDrop);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(el); this.resize();
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose() {
    cancelAnimationFrame(this.raf); this.ro.disconnect();
    const cv = this.renderer.domElement;
    cv.removeEventListener('pointermove', this.onMove); cv.removeEventListener('pointerdown', this.onDown); cv.removeEventListener('pointerup', this.onUp);
    this.el.removeEventListener('dragover', this.onDragOver); this.el.removeEventListener('drop', this.onDrop);
    this.controls.dispose(); this.renderer.dispose(); cv.remove(); this.ov.remove();
  }

  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.fov = this.camera.aspect < 0.9 ? 58 : 42; this.camera.updateProjectionMatrix();
  }
  setLite(on: boolean) { this.renderer.setPixelRatio(on ? 1 : Math.min(window.devicePixelRatio, 2)); this.renderer.shadowMap.enabled = !on; this.scene.traverse((o) => { const m = (o as THREE.Mesh).material; if (m && !Array.isArray(m)) m.needsUpdate = true; }); this.resize(); }

  /* ---------------- dữ liệu ---------------- */
  setLesson(L: Lesson3D) {
    const prevBase = this.lesson?.base; this.lesson = L;
    if (prevBase !== L.base || !this.slab.children.length) this.buildBase(L.base);
    const keep = new Set<string>();
    L.objects.forEach((o) => { keep.add(o.id); this.syncNode(o); });
    [...this.nodes.keys()].forEach((id) => { if (!keep.has(id)) { this.scene.remove(this.nodes.get(id)!.root); this.nodes.delete(id); } });
    if (this.sel && !keep.has(this.sel)) this.select(null, false);
    this.buildLinks(); this.syncPins();
  }
  setRuntime(rt: Runtime) { this.runtime = rt; this.lesson?.objects.forEach((o) => this.syncNode(o)); this.buildLinks(); }
  private eff(o: Obj3D): Obj3D & { hidden?: boolean; speedMul: number } {
    const r = this.runtime[o.id] ?? {};
    return { ...o, on: r.on ?? o.on, split: r.split ?? o.split, hidden: r.hidden, speedMul: r.speed ?? 1 };
  }
  private buildBase(b: BaseType) {
    const B = BASES[b] ?? BASES.grass; this.slab.clear();
    const mat = (c: string) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 16), mat(B.top)); top.position.y = -0.2; top.receiveShadow = true; this.slab.add(top);
    const side = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 16), mat(B.side)); side.position.y = -1.4; this.slab.add(side);
    if (b === 'road') for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.15), mat('#f8fafc')); m.position.set(-9 + i * 2.3, 0.01, 0); this.slab.add(m); }
    if (b === 'space') this.scene.add(this.stars); else this.scene.remove(this.stars);
    this.el.style.background = B.bg;
  }
  private syncNode(o: Obj3D) {
    const a = ASSET_BY_ID[o.type]; if (!a) return;
    const e = this.eff(o);
    const key = JSON.stringify([o.type, o.color, a.text ? o.name : '', e.on ? 1 : 0, o.fx.type]);
    let n = this.nodes.get(o.id);
    if (!n || n.key !== key) {
      if (n) this.scene.remove(n.root);
      const root = new THREE.Group(); const body = a.b({ color: o.color, name: o.name, on: e.on }); root.add(body);
      root.traverse((m) => { m.userData.id = o.id; });
      n = { root, body, key, ang: Math.atan2(o.z, o.x), rad: Math.hypot(o.x, o.z), t0: performance.now() };
      if (['up', 'rain', 'snow', 'wind'].includes(o.fx.type)) {
        const N = o.fx.type === 'wind' ? 40 : 70; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
        const col = o.fx.type === 'rain' ? 0x1677c4 : o.fx.type === 'up' ? 0xbfe8ff : 0xffffff;
        n.pts = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size: o.fx.type === 'rain' ? 0.16 : 0.3, map: this.dotTex, transparent: true, depthWrite: false }));
        n.pts.frustumCulled = false; n.pts.raycast = () => {}; root.add(n.pts);
        n.seeds = Array.from({ length: N }, () => [Math.random(), (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.2]);
      }
      this.nodes.set(o.id, n); this.scene.add(root);
    }
    n.root.position.set(o.x, o.y, o.z); n.root.rotation.y = o.ry; n.root.scale.setScalar(o.s);
    if (o.fx.type !== 'orbit') { n.ang = Math.atan2(o.z, o.x); n.rad = Math.hypot(o.x, o.z); }
    const parts = n.body.userData.parts as Part[] | undefined;
    if (parts) parts.forEach((p) => p.obj.position.copy(p.base).addScaledVector(p.dir, e.split ? 1 : 0));
    const hiddenByScene = this.playScene !== null && (o.appear ?? 0) > this.playScene + 1;
    n.root.visible = !e.hidden && !hiddenByScene;
  }
  /** vị trí neo (đỉnh khối) của đồ vật để gắn ghim / mũi tên */
  private anchor(id: string, top = true) {
    const n = this.nodes.get(id); if (!n) return null;
    const b = new THREE.Box3(); n.root.updateWorldMatrix(true, true); n.body.traverse((m) => { if ((m as THREE.Mesh).isMesh) b.expandByObject(m); });
    if (b.isEmpty()) return n.root.position.clone();
    return new THREE.Vector3((b.min.x + b.max.x) / 2, top ? b.max.y : (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
  }
  private buildLinks() {
    this.linkGroup.clear();
    this.linkLabels.forEach((el) => el.remove()); this.linkLabels.clear();
    (this.lesson?.links ?? []).forEach((l) => this.buildLink(l));
  }
  private buildLink(l: Link3D) {
    const a0 = this.anchor(l.from, l.kind === 'arrow'), b0 = this.anchor(l.to, l.kind === 'arrow');
    if (!a0 || !b0) return;
    const visA = this.nodes.get(l.from)?.root.visible, visB = this.nodes.get(l.to)?.root.visible; if (!visA || !visB) return;
    const color = l.kind === 'arrow' ? 0xf97316 : l.kind === 'wire' ? 0xdc2626 : 0x1e3a8a;
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    let curve: THREE.Curve<THREE.Vector3>; let mid: THREE.Vector3;
    if (l.kind === 'measure') {
      const a = new THREE.Vector3(a0.x, 0.12, a0.z), b = new THREE.Vector3(b0.x, 0.12, b0.z);
      curve = new THREE.LineCurve3(a, b); mid = a.clone().lerp(b, 0.5).setY(0.5);
      [a, b].forEach((p) => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), m); t.position.copy(p).setY(0.25); this.linkGroup.add(t); });
    } else if (l.kind === 'wire') {
      const a = new THREE.Vector3(a0.x, 0.25, a0.z), b = new THREE.Vector3(b0.x, 0.25, b0.z);
      curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).setY(0.05), b]); mid = a.clone().lerp(b, 0.5).setY(0.6);
    } else {
      const a = a0.clone().setY(a0.y + 0.3), b = b0.clone().setY(b0.y + 0.3);
      const h = Math.max(a.y, b.y) + 0.8 + a.distanceTo(b) * 0.15;
      curve = new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).setY(h), b); mid = curve.getPoint(0.5).add(new THREE.Vector3(0, 0.35, 0));
      const tip = curve.getPoint(1), dir = tip.clone().sub(curve.getPoint(0.93)).normalize();
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 10), m); head.position.copy(tip); head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); this.linkGroup.add(head);
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, l.kind === 'measure' ? 0.03 : 0.05, 6), m); tube.castShadow = true; this.linkGroup.add(tube);
    if (l.label) { const s = document.createElement('span'); s.className = `s3d-ll is-${l.kind}`; s.textContent = l.label; this.ov.appendChild(s); s.dataset.x = String(mid.x); s.dataset.y = String(mid.y); s.dataset.z = String(mid.z); this.linkLabels.set(l.id, s); }
  }
  syncPins() {
    this.pins.forEach((p) => p.remove()); this.pins.clear();
    let k = 0;
    (this.lesson?.objects ?? []).forEach((o) => {
      if (!o.spot.on) return; k++;
      const b = document.createElement('button'); b.type = 'button'; b.className = 's3d-pin';
      b.innerHTML = `<b><span>${k}</span></b><i>${esc(o.spot.title || o.name)}</i>`;
      b.setAttribute('aria-label', `Điểm chạm ${k}: ${o.spot.title || o.name}`);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (this.playScene !== null) this.ev.onPick?.(o.id); else this.select(o.id); });
      this.ov.appendChild(b); this.pins.set(o.id, b);
    });
  }

  /* ---------------- chọn, đặt, kéo ---------------- */
  select(id: string | null, notify = true) {
    this.sel = id; this.selBox.visible = !!id && this.nodes.has(id);
    if (notify) this.ev.onSelect?.(id);
  }
  highlight(id: string | null) { this.sel = id; this.selBox.visible = !!id && this.nodes.has(id); }
  startPlacing(type: string | null) {
    if (this.ghost) this.scene.remove(this.ghost); this.ghost = null; this.placing = type;
    if (!type) return; const a = ASSET_BY_ID[type]; if (!a) return;
    const g = a.b({ color: a.color, name: a.name });
    g.traverse((m) => { const mm = m as THREE.Mesh; if (mm.material && !Array.isArray(mm.material)) { mm.material = (mm.material as THREE.Material).clone(); (mm.material as THREE.Material).transparent = true; (mm.material as THREE.Material).opacity = 0.5; } m.raycast = () => {}; });
    g.visible = false; this.ghost = g; this.scene.add(g);
  }
  private snapV = (v: number) => (this.snap ? Math.round(v * 2) / 2 : r1(v));
  private clampX = (v: number) => Math.max(-10.5, Math.min(10.5, v));
  private clampZ = (v: number) => Math.max(-7.5, Math.min(7.5, v));
  private groundAt(e: { clientX: number; clientY: number }) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ptr, this.camera); const p = new THREE.Vector3();
    return this.ray.ray.intersectPlane(this.ground, p) ? p : null;
  }
  private pickAt(e: { clientX: number; clientY: number }) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ptr, this.camera);
    const hit = this.ray.intersectObjects([...this.nodes.values()].filter((n) => n.root.visible).map((n) => n.root), true)[0];
    return (hit?.object.userData.id as string | undefined) ?? null;
  }
  private onMove = (e: PointerEvent) => {
    if (this.ghost && this.placing) { const p = this.groundAt(e); this.ghost.visible = !!p; if (p) this.ghost.position.set(this.clampX(this.snapV(p.x)), ASSET_BY_ID[this.placing]?.y ?? 0, this.clampZ(this.snapV(p.z))); }
    if (this.drag) { const p = this.groundAt(e); const n = this.nodes.get(this.drag.id); if (p && n) { n.root.position.x = this.clampX(this.snapV(p.x + this.drag.dx)); n.root.position.z = this.clampZ(this.snapV(p.z + this.drag.dz)); } }
  };
  private onDown = (e: PointerEvent) => {
    this.down = [e.clientX, e.clientY];
    if (this.placing || this.playScene !== null) return;
    const id = this.pickAt(e);
    if (id && id === this.sel) { const p = this.groundAt(e); const n = this.nodes.get(id); if (p && n) { this.drag = { id, dx: n.root.position.x - p.x, dz: n.root.position.z - p.z }; this.controls.enabled = false; this.renderer.domElement.setPointerCapture(e.pointerId); } }
  };
  private onUp = (e: PointerEvent) => {
    const moved = this.down && Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) > 5;
    if (this.drag) { const n = this.nodes.get(this.drag.id); const id = this.drag.id; this.drag = null; this.controls.enabled = true; if (n && moved) this.ev.onMoved?.(id, r1(n.root.position.x), r1(n.root.position.z)); return; }
    if (moved) return;
    if (this.placing) { const p = this.groundAt(e); if (p) this.ev.onPlace?.(this.placing, this.clampX(this.snapV(p.x)), this.clampZ(this.snapV(p.z))); return; }
    const id = this.pickAt(e);
    if (this.playScene !== null) { if (id) this.ev.onPick?.(id); return; }
    this.select(id);
  };
  private onDragOver = (e: DragEvent) => e.preventDefault();
  private onDrop = (e: DragEvent) => { e.preventDefault(); const t = e.dataTransfer?.getData('text/plain'); const p = this.groundAt(e); if (t && ASSET_BY_ID[t] && p) this.ev.onPlace?.(t, this.clampX(this.snapV(p.x)), this.clampZ(this.snapV(p.z))); };

  /* ---------------- camera ---------------- */
  flyTo(cam: number[], tgt: number[]) { if (cam?.length !== 3 || tgt?.length !== 3) return; this.fly = { p0: this.camera.position.clone(), t0: this.controls.target.clone(), p1: new THREE.Vector3(cam[0], cam[1], cam[2]), t1: new THREE.Vector3(tgt[0], tgt[1], tgt[2]), u: 0 }; }
  home() { this.flyTo([13, 9, 15], [0, 1.5, 0]); }
  camNow() { return { cam: this.camera.position.toArray().map(r1), tgt: this.controls.target.toArray().map(r1) }; }
  refreshVisibility() { this.lesson?.objects.forEach((o) => this.syncNode(o)); this.buildLinks(); }

  /* ---------------- vòng vẽ ---------------- */
  private v = new THREE.Vector3();
  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; const t = now / 1000;
    (this.lesson?.objects ?? []).forEach((o) => {
      const n = this.nodes.get(o.id); if (!n || this.drag?.id === o.id) return;
      const e = this.eff(o); const sp = (o.fx.speed || 1) * e.speedMul; const fx = o.fx.type;
      const rotor = n.body.getObjectByName('rotor');
      const active = sp > 0.01 && (ASSET_BY_ID[o.type]?.onoff ? e.on !== false : true);
      if (fx === 'spin' && active) { if (rotor) rotor.rotation.x += dt * sp * 6; else n.root.rotation.y += dt * sp * 1.2; }
      if (fx === 'pulse') n.root.scale.setScalar(o.s * (1 + Math.sin(t * 2.4 * sp) * 0.12));
      if (fx === 'bob') n.root.position.y = o.y + Math.sin(t * 2 * sp) * 0.15;
      if (fx === 'blink') n.body.visible = Math.sin(t * 5 * sp) > -0.4;
      if (fx === 'orbit') { n.ang += dt * 0.35 * sp; n.root.position.set(Math.cos(n.ang) * n.rad, o.y, Math.sin(n.ang) * n.rad); if (rotor) rotor.rotation.y += dt * 2; }
      if (fx === 'tilt') { const beam = n.body.userData.beam as THREE.Object3D | undefined; if (beam) beam.rotation.z = Math.sin(t * 1.2 * sp) * 0.25; }
      if (fx === 'clock') { const h = n.body.userData.hands as { h: THREE.Object3D; m: THREE.Object3D } | undefined; if (h) { h.m.rotation.z -= dt * sp * 1.2; h.h.rotation.z -= (dt * sp * 1.2) / 12; } }
      if (fx === 'heat') n.root.traverse((m) => { const mm = (m as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (mm && 'emissive' in mm && !Array.isArray(mm)) { mm.emissive?.setRGB(0.9, 0.2, 0.05); mm.emissiveIntensity = 0.25 + 0.25 * Math.sin(t * 2 * sp); } });
      if (fx === 'wave') { const k = ((t * 0.6 * sp) % 1); n.root.scale.setScalar(o.s * (1 + 0.04 * Math.sin(t * 20))); if (!n.body.userData.rings) { const rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 40), new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true })); r.rotation.y = Math.PI / 2; r.raycast = () => {}; n.root.add(r); return r; }); n.body.userData.rings = rings; } (n.body.userData.rings as THREE.Mesh[]).forEach((r, i) => { const u = (k + i / 3) % 1; r.scale.setScalar(0.5 + u * 3); r.position.set(0.5 + u * 2, 0.9, 0); (r.material as THREE.MeshBasicMaterial).opacity = 1 - u; }); }
      if (fx === 'traffic') { const L = n.body.userData.lights as THREE.MeshStandardMaterial[] | undefined; if (L) { const phase = e.on === false ? -1 : Math.floor((t * sp) / 2) % 3; const order = [2, 1, 0]; L.forEach((m, i) => { m.emissiveIntensity = phase >= 0 && order[phase] === i ? 1.4 : 0.05; }); } }
      if (n.pts && n.seeds) {
        const arr = n.pts.geometry.attributes.position.array as Float32Array; const up = fx === 'up', wind = fx === 'wind', snow = fx === 'snow';
        n.pts.visible = active;
        const h = up ? 4 : Math.max(0.5, o.y / o.s);
        n.seeds.forEach(([ph, dx, dz], i) => {
          const u = (t * (up ? 0.25 : wind ? 0.5 : snow ? 0.25 : 0.9) * sp + ph) % 1;
          if (wind) { arr[i * 3] = -3 + u * 6; arr[i * 3 + 1] = 0.6 + ph * 2 + Math.sin(u * 12 + i) * 0.15; arr[i * 3 + 2] = dz * 1.2; }
          else { arr[i * 3] = dx * (up ? 0.6 + u * 0.4 : 1) + (snow ? Math.sin(u * 10 + i) * 0.2 : 0); arr[i * 3 + 1] = up ? 0.3 + u * h : -u * h; arr[i * 3 + 2] = dz * (up ? 0.6 + u * 0.4 : 0.6); }
        });
        n.pts.geometry.attributes.position.needsUpdate = true;
      }
    });
    if (this.fly) { this.fly.u = Math.min(1, this.fly.u + dt / 1.1); const k = 1 - Math.pow(1 - this.fly.u, 3); this.camera.position.lerpVectors(this.fly.p0, this.fly.p1, k); this.controls.target.lerpVectors(this.fly.t0, this.fly.t1, k); if (this.fly.u >= 1) this.fly = null; }
    if (this.selBox.visible && this.sel) { const n = this.nodes.get(this.sel); if (n) { this.selB.makeEmpty(); n.root.updateWorldMatrix(true, true); n.body.traverse((m) => { if ((m as THREE.Mesh).isMesh) this.selB.expandByObject(m); }); } }
    this.controls.update(); this.renderer.render(this.scene, this.camera); this.placeOverlay();
    this.raf = requestAnimationFrame(this.frame);
  };
  private placeOverlay() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    const put = (el: HTMLElement, p: THREE.Vector3) => { this.v.copy(p).project(this.camera); el.style.display = this.v.z < 1 ? '' : 'none'; el.style.left = `${(this.v.x * 0.5 + 0.5) * w}px`; el.style.top = `${(-this.v.y * 0.5 + 0.5) * h}px`; };
    this.pins.forEach((el, id) => {
      const n = this.nodes.get(id); const p = this.anchor(id);
      if (!n || !p || !n.root.visible) { el.style.display = 'none'; return; }
      put(el, p.setY(p.y + 0.3)); el.classList.toggle('is-sel', this.sel === id); el.classList.toggle('is-quiz', this.quizMode);
    });
    this.linkLabels.forEach((el) => put(el, new THREE.Vector3(Number(el.dataset.x), Number(el.dataset.y), Number(el.dataset.z))));
  }
}

/** Ảnh nhỏ của từng đồ vật cho thư viện (dựng một lần, trả về data URL) */
export function makeThumbs(ids: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof document === 'undefined') return out;
  let r: THREE.WebGLRenderer;
  try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch { return out; }
  r.setSize(96, 96); r.setClearColor(0, 0);
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.4)); const d = new THREE.DirectionalLight(0xffffff, 1.2); d.position.set(3, 5, 4); sc.add(d);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  ids.forEach((id) => {
    const a = ASSET_BY_ID[id]; if (!a) return;
    const g = a.b({ color: a.color, name: a.text ? 'Chữ' : a.name, on: a.onoff ? true : undefined }); sc.add(g);
    const box = new THREE.Box3().setFromObject(g); const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3()).length() || 1;
    cam.position.set(c.x + s * 0.95, c.y + s * 0.6, c.z + s * 1.25); cam.lookAt(c); r.render(sc, cam);
    out[id] = r.domElement.toDataURL(); sc.remove(g);
  });
  r.dispose();
  return out;
}
