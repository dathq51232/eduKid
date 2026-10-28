// Phòng triển lãm 3D của lớp (Three.js, chạy trên trình duyệt):
// tường trong cùng = thư khen, tường trái = tranh mỹ thuật, tường phải = bài luyện chữ, tường cửa vào = biển tên lớp.
// Đi lại bằng phím mũi tên / WASD, kéo chuột (vuốt) để nhìn quanh, bấm vào tranh để lại gần và xem lớn.
import * as THREE from 'three';
import { WALL_LABEL, autoSize, type GalleryKind, type RoomTheme } from './types';

export type RoomItem = { id: string; kind: GalleryKind; url?: string; w: number; h: number; name: string; title: string; mine: boolean; scale?: number };
export type Slot = { id: string; kind: GalleryKind; x: number; y: number; z: number; yaw: number; fw: number; fh: number; mine: boolean; k: number };
export type Layout = { W: number; L: number; H: number; slots: Slot[]; sizes: Record<GalleryKind, number> };
export type Pose = { x: number; z: number; yaw: number };

const H = 6;
const EYE = 1.6;
const AVAIL = H - 1.0; // từ sàn tới dưới biển tên tường
const BOX: Record<GalleryKind, [number, number]> = { praise: [2.1, 1.5], art: [1.8, 1.55], writing: [1.8, 1.55] };
const KINDS: GalleryKind[] = ['praise', 'art', 'writing'];


/** Tính kích thước phòng và vị trí từng khung (dùng chung cho sân khấu 3D và bản đồ nhỏ).
 *  sizes: cỡ khung cả bức tường (0.4–1.4); item.scale: cỡ riêng từng khung. */
export function layoutRoom(items: RoomItem[], sizes: Partial<Record<GalleryKind, number>> = {}): Layout {
  const ks = {} as Record<GalleryKind, number>;
  type Row = { list: { it: RoomItem; fw: number; fh: number; w: number }[]; len: number; y: number };
  const walls = {} as Record<GalleryKind, Row[]>;
  for (const kind of KINDS) {
    const list = items.filter((i) => i.kind === kind);
    const k = Math.max(0.4, Math.min(1.4, sizes[kind] ?? autoSize(list.length)));
    ks[kind] = k;
    const [bw, bh] = BOX[kind];
    const rowH = 2.35 * k * (bh / 1.55);
    const maxRows = Math.max(1, Math.min(4, Math.floor(AVAIL / rowH)));
    const pref = Math.max(2, Math.round((kind === 'praise' ? 4 : 5) / k));
    const rows = Math.min(maxRows, Math.max(1, Math.ceil(list.length / pref)));
    const per = Math.ceil(list.length / rows) || 1;
    const base = Math.max(0.1, (AVAIL - rows * rowH) / 2);
    const out: Row[] = [];
    for (let r = 0; r < rows; r++) {
      const part = list.slice(r * per, (r + 1) * per).map((it) => {
        const sc = Math.max(0.4, Math.min(1.6, it.scale ?? 1)) * k;
        const ratio = Math.max(0.2, it.w / Math.max(1, it.h));
        const [fw, fh] = ratio > bw / bh ? [bw * sc, (bw * sc) / ratio] : [bh * sc * ratio, bh * sc];
        return { it, fw, fh, w: fw + 0.3 * k + 0.5 * k };
      });
      const y = rows === 1 ? Math.max(1.85, 0.5 * k + (bh * k) / 2 + 0.35) : base + r * rowH + 0.5 * k + (bh * k + 0.3 * k) / 2;
      out.push({ list: part, len: part.reduce((a, b) => a + b.w, 0), y });
    }
    walls[kind] = out;
  }
  const longest = (k: GalleryKind) => Math.max(0, ...walls[k].map((r) => r.len));
  const L = Math.max(11, Math.max(longest('art'), longest('writing')) + 3.6);
  const W = Math.max(9.5, longest('praise') + 2.4);
  const slots: Slot[] = [];
  for (const kind of KINDS) {
    for (const row of walls[kind]) {
      let cum = 0;
      for (const { it, fw, fh, w } of row.list) {
        const c = cum + w / 2; cum += w;
        if (kind === 'praise') slots.push({ id: it.id, kind, x: -row.len / 2 + c, y: row.y, z: -L / 2 + 0.06, yaw: 0, fw, fh, mine: it.mine, k: ks[kind] });
        else {
          const left = kind === 'art';
          // hàng xếp từ phía cửa vào trong
          slots.push({ id: it.id, kind, x: left ? -W / 2 + 0.06 : W / 2 - 0.06, y: row.y, z: L / 2 - 1.8 - c, yaw: left ? Math.PI / 2 : -Math.PI / 2, fw, fh, mine: it.mine, k: ks[kind] });
        }
      }
    }
  }
  return { W, L, H, slots, sizes: ks };
}

/* ------------------------------------------------------------ vẽ chữ / họa tiết lên canvas làm texture */
function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, aniso = 4) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}
const FONT = '"Baloo 2", "PraiseBaloo", "Quicksand", system-ui, sans-serif';
function fitText(c: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight = 800) {
  let s = size;
  do { c.font = `${weight} ${s}px ${FONT}`; s -= 2; } while (c.measureText(text).width > maxW && s > 12);
}
function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

export class GalleryScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(62, 1, 0.05, 200);
  private room = new THREE.Group();
  private pickables: THREE.Mesh[] = [];
  private textures: THREE.Texture[] = [];
  private layout: Layout = { W: 10, L: 12, H, slots: [], sizes: { praise: 1, art: 1, writing: 1 } };
  private imgCache = new Map<string, THREE.Texture>();
  private frames = new Map<string, { g: THREE.Group; s: Slot }>();
  private sel: string | null = null;
  private selMesh: THREE.Mesh | null = null;
  private yaw = 0;
  private pitch = 0;
  private pos = new THREE.Vector3(0, EYE, 4);
  private keys = new Set<string>();
  private move = { f: 0, s: 0, t: 0 };
  private fly: { p0: THREE.Vector3; p1: THREE.Vector3; y0: number; y1: number; q0: number; q1: number; u: number } | null = null;
  private down: { x: number; y: number; moved: boolean; id: number } | null = null;
  private raf = 0;
  private last = performance.now();
  private lastPose = 0;
  private ro: ResizeObserver;
  private ray = new THREE.Raycaster();
  private hovered: string | null = null;
  private disposed = false;
  private loader = new THREE.TextureLoader();

  constructor(private el: HTMLElement, private theme: RoomTheme, private cb: { onOpen: (id: string) => void; onPose?: (p: Pose) => void; onHover?: (id: string | null) => void }) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'gr-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    el.appendChild(this.renderer.domElement);
    this.loader.setCrossOrigin('anonymous');
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.room);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(el);
    this.resize();
    const cv = this.renderer.domElement;
    cv.addEventListener('pointerdown', this.onDown);
    cv.addEventListener('pointermove', this.onMoveP);
    cv.addEventListener('pointerup', this.onUp);
    cv.addEventListener('pointercancel', this.onUp);
    cv.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('keydown', this.onKey);
    el.addEventListener('keyup', this.onKeyUp);
    el.addEventListener('blur', this.clearKeys);
    document.addEventListener('visibilitychange', this.onVis);
    this.loop();
  }

  /* ------------------------------------------------------------ dựng phòng */
  setItems(items: RoomItem[], className: string, opts: { theme?: RoomTheme; sizes?: Partial<Record<GalleryKind, number>>; keepCam?: boolean } = {}) {
    if (opts.theme) this.theme = opts.theme;
    this.clearRoom();
    const lay = layoutRoom(items, opts.sizes);
    this.layout = lay;
    const { W, L } = lay;
    const t = this.theme;
    this.scene.background = new THREE.Color(t.sky);
    this.scene.fog = new THREE.Fog(t.sky, Math.max(W, L) * 1.2, Math.max(W, L) * 3);

    const hemi = new THREE.HemisphereLight(0xffffff, new THREE.Color(t.floor), 1.15);
    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(2, 8, 4);
    this.room.add(hemi, sun);

    // sàn gỗ
    const plank = canvasTex(512, 512, (c) => {
      c.fillStyle = t.floor; c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 8; i++) {
        const y = i * 64;
        c.fillStyle = `rgba(0,0,0,${0.04 + (i % 3) * 0.025})`; c.fillRect(0, y, 512, 64);
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, y, 512, 2);
        const off = (i * 197) % 512; c.fillRect(off, y, 2, 64);
        c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1;
        for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(0, y + 10 + k * 11); c.bezierCurveTo(170, y + 6 + k * 11, 340, y + 16 + k * 11, 512, y + 9 + k * 11); c.stroke(); }
      }
    }, 8);
    plank.wrapS = plank.wrapT = THREE.RepeatWrapping;
    plank.repeat.set(W / 3, L / 3);
    this.textures.push(plank);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshLambertMaterial({ map: plank }));
    floor.rotation.x = -Math.PI / 2;
    this.room.add(floor);
    // thảm tròn giữa phòng
    const rugTex = canvasTex(256, 256, (c) => {
      const g = c.createRadialGradient(128, 128, 20, 128, 128, 128);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, t.wall2); g.addColorStop(0.56, t.accent); g.addColorStop(0.62, t.accent); g.addColorStop(0.63, t.wall2); g.addColorStop(1, t.wall2);
      c.fillStyle = g; c.beginPath(); c.arc(128, 128, 127, 0, Math.PI * 2); c.fill();
    });
    this.textures.push(rugTex);
    const rug = new THREE.Mesh(new THREE.CircleGeometry(Math.min(W, L) * 0.22, 48), new THREE.MeshLambertMaterial({ map: rugTex, transparent: true }));
    rug.rotation.x = -Math.PI / 2; rug.position.y = 0.01;
    this.room.add(rug);

    // tường: nửa dưới đậm, nửa trên nhạt + chỉ ngang
    const wallTex = canvasTex(64, 256, (c) => {
      c.fillStyle = t.wall; c.fillRect(0, 0, 64, 256);
      c.fillStyle = t.wall2; c.fillRect(0, 190, 64, 66);
      c.fillStyle = t.accent; c.fillRect(0, 186, 64, 5);
      c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, 250, 64, 6);
    });
    this.textures.push(wallTex);
    const wallMat = (len: number) => { const m = wallTex.clone(); m.wrapS = THREE.RepeatWrapping; m.repeat.set(len / 2, 1); m.needsUpdate = true; this.textures.push(m); return new THREE.MeshLambertMaterial({ map: m }); };
    const wall = (len: number, x: number, z: number, ry: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, H), wallMat(len));
      m.position.set(x, H / 2, z); m.rotation.y = ry; this.room.add(m);
    };
    wall(W, 0, -L / 2, 0);
    wall(W, 0, L / 2, Math.PI);
    wall(L, -W / 2, 0, Math.PI / 2);
    wall(L, W / 2, 0, -Math.PI / 2);
    // trần + đèn
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshBasicMaterial({ color: '#fbfbfb' }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = H; this.room.add(ceil);
    const lampMat = new THREE.MeshBasicMaterial({ color: '#fffbe8' });
    for (let z = -L / 2 + 2.5; z < L / 2 - 1; z += 3.2) {
      for (const x of [-W / 4, W / 4]) {
        const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), lampMat);
        lamp.rotation.x = Math.PI / 2; lamp.position.set(x, H - 0.01, z); this.room.add(lamp);
      }
    }

    // biển tên từng tường
    const heading = (kind: GalleryKind, x: number, z: number, ry: number) => {
      const tex = canvasTex(1024, 160, (c) => {
        roundRect(c, 8, 12, 1008, 136, 68); c.fillStyle = t.accent; c.fill();
        c.fillStyle = '#ffffff'; fitText(c, WALL_LABEL[kind].toUpperCase(), 900, 84); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(WALL_LABEL[kind].toUpperCase(), 512, 84);
      });
      this.textures.push(tex);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.44), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      m.position.set(x, H - 0.62, z); m.rotation.y = ry; this.room.add(m);
    };
    heading('praise', 0, -L / 2 + 0.03, 0);
    heading('art', -W / 2 + 0.03, 0, Math.PI / 2);
    heading('writing', W / 2 - 0.03, 0, -Math.PI / 2);

    // tường cửa vào: cửa + biển tên lớp
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), new THREE.MeshLambertMaterial({ color: t.frame }));
    door.position.set(0, 1.3, L / 2 - 0.02); door.rotation.y = Math.PI; this.room.add(door);
    const sign = canvasTex(1024, 256, (c) => {
      c.fillStyle = '#ffffff'; roundRect(c, 6, 6, 1012, 244, 40); c.fill();
      c.lineWidth = 10; c.strokeStyle = t.accent; c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = t.frame;
      fitText(c, 'PHÒNG TRIỂN LÃM', 900, 70); c.fillText('PHÒNG TRIỂN LÃM', 512, 92);
      c.fillStyle = t.accent; fitText(c, `LỚP ${className.toUpperCase()}`, 900, 92); c.fillText(`LỚP ${className.toUpperCase()}`, 512, 180);
    });
    this.textures.push(sign);
    const signM = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: sign }));
    signM.position.set(0, 3.6, L / 2 - 0.03); signM.rotation.y = Math.PI; this.room.add(signM);

    this.decorate(W, L);

    // khung tranh
    const byId = new Map(items.map((i) => [i.id, i]));
    for (const s of lay.slots) this.addFrame(s, byId.get(s.id)!);
    if (!items.some((i) => i.kind === 'praise')) this.emptyNote(0, 1.85, -L / 2 + 0.07, 0);
    if (!items.some((i) => i.kind === 'art')) this.emptyNote(-W / 2 + 0.07, 1.85, 0, Math.PI / 2);
    if (!items.some((i) => i.kind === 'writing')) this.emptyNote(W / 2 - 0.07, 1.85, 0, -Math.PI / 2);

    // dọn ảnh của tác phẩm đã xoá khỏi bộ nhớ
    for (const [id, tex] of this.imgCache) if (!byId.has(id)) { tex.dispose(); this.imgCache.delete(id); }
    if (opts.keepCam) this.clampPos(this.pos);
    else { this.pos.set(0, EYE, L / 2 - 1.6); this.yaw = 0; this.pitch = -0.02; }
    if (this.sel) this.setSelected(this.sel);
    this.applyCam();
    this.emitPose(true);
  }

  private decorate(W: number, L: number) {
    const t = this.theme;
    // dây cờ đuôi nheo dọc ba tường
    const pos: number[] = [], col: number[] = [];
    const c = new THREE.Color();
    const run = (ax: number, az: number, bx: number, bz: number, nx: number, nz: number) => {
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.max(2, Math.floor(len / 0.55));
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, um = (u0 + u1) / 2;
        const sag = (u: number) => Math.sin(u * Math.PI) * 0.07;
        const p = (u: number, dy: number) => [ax + (bx - ax) * u + nx * 0.08, H - 0.06 - sag(u) + dy, az + (bz - az) * u + nz * 0.08];
        pos.push(...p(u0 + 0.004, 0), ...p(u1 - 0.004, 0), ...p(um, -0.28));
        c.set(t.flags[i % t.flags.length]);
        for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
      }
    };
    run(-W / 2, L / 2 - 0.5, -W / 2, -L / 2 + 0.5, 1, 0);
    run(W / 2, -L / 2 + 0.5, W / 2, L / 2 - 0.5, -1, 0);
    run(-W / 2 + 0.5, -L / 2, W / 2 - 0.5, -L / 2, 0, 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.room.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    if (t.lanterns) {
      const red = new THREE.MeshLambertMaterial({ color: '#dc2626', emissive: '#7f1d1d' });
      const gold = new THREE.MeshLambertMaterial({ color: '#facc15' });
      for (let z = -L / 2 + 2; z < L / 2 - 1.5; z += 2.6) {
        for (const x of [-W / 6, W / 6]) {
          const lan = new THREE.Group();
          const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), red); body.scale.y = 0.8; lan.add(body);
          const top = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 16), gold); top.position.y = 0.24; lan.add(top);
          const bot = top.clone(); bot.position.y = -0.24; lan.add(bot);
          const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.3, 8), gold); tassel.position.y = -0.42; lan.add(tassel);
          const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.5, 4), gold); cord.position.y = 0.52; lan.add(cord);
          lan.position.set(x, H - 1.0, z); this.room.add(lan);
        }
      }
    }
  }

  private emptyNote(x: number, y: number, z: number, ry: number) {
    const tex = canvasTex(1024, 360, (c) => {
      c.setLineDash([22, 16]); c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.25)';
      roundRect(c, 10, 10, 1004, 340, 30); c.stroke();
      c.fillStyle = 'rgba(0,0,0,.45)'; c.textAlign = 'center'; c.textBaseline = 'middle';
      fitText(c, 'Chưa có tác phẩm', 900, 76, 700); c.fillText('Chưa có tác phẩm', 512, 180);
    });
    this.textures.push(tex);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.92), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    m.position.set(x, y, z); m.rotation.y = ry; this.room.add(m);
  }

  private addFrame(s: Slot, it: RoomItem) {
    const t = this.theme;
    const g = new THREE.Group();
    g.position.set(s.x, s.y, s.z);
    g.rotation.y = s.yaw;
    const pk = Math.max(0.55, s.k);
    const bw = 0.07 * pk, mat = 0.08 * pk;
    // quầng sáng trên tường (giả đèn rọi)
    const glowTex = this.glowTex ??= canvasTex(128, 128, (c) => {
      const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,248,220,.55)'); gr.addColorStop(1, 'rgba(255,248,220,0)');
      c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(s.fw * 1.9, s.fh * 1.7), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }));
    glow.position.set(0, 0.12, 0.002); g.add(glow);
    // khung gỗ + viền giấy
    const frame = new THREE.Mesh(new THREE.BoxGeometry(s.fw + 2 * (bw + mat), s.fh + 2 * (bw + mat), 0.06), new THREE.MeshLambertMaterial({ color: it.mine ? '#d4a017' : t.frame }));
    frame.position.z = 0.03; frame.userData.id = it.id; g.add(frame);
    this.pickables.push(frame);
    const matM = new THREE.Mesh(new THREE.PlaneGeometry(s.fw + 2 * mat, s.fh + 2 * mat), new THREE.MeshBasicMaterial({ color: '#fffdf7' }));
    matM.position.z = 0.061; g.add(matM);
    const imgMat = new THREE.MeshBasicMaterial({ color: '#e5e7eb', toneMapped: false });
    const img = new THREE.Mesh(new THREE.PlaneGeometry(s.fw, s.fh), imgMat);
    img.position.z = 0.062; img.userData.id = it.id; g.add(img);
    this.pickables.push(img);
    const cached = this.imgCache.get(it.id);
    if (cached) { imgMat.map = cached; imgMat.color.set('#ffffff'); }
    else if (it.url) {
      this.loader.load(it.url, (tex) => {
        if (this.disposed) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        this.imgCache.get(it.id)?.dispose();
        this.imgCache.set(it.id, tex); // giữ lại khi sắp xếp lại phòng, không tải lại ảnh
        imgMat.map = tex; imgMat.color.set('#ffffff'); imgMat.needsUpdate = true;
      }, undefined, () => { imgMat.color.set('#fecaca'); });
    }
    // bảng tên
    const plate = canvasTex(512, 128, (c) => {
      roundRect(c, 4, 4, 504, 120, 18); c.fillStyle = '#ffffff'; c.fill();
      c.lineWidth = 4; c.strokeStyle = it.mine ? '#d4a017' : 'rgba(0,0,0,.15)'; c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#1f2937'; fitText(c, it.name || 'Cả lớp', 470, 46); c.fillText(it.name || 'Cả lớp', 256, 46);
      c.fillStyle = '#6b7280'; fitText(c, it.title || '', 470, 30, 600); c.fillText(it.title || '', 256, 94);
    });
    this.textures.push(plate);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * pk, 0.225 * pk), new THREE.MeshBasicMaterial({ map: plate, transparent: true }));
    pm.position.set(0, -s.fh / 2 - bw - mat - 0.2 * pk, 0.01); pm.userData.id = it.id; g.add(pm);
    this.pickables.push(pm);
    if (it.mine) {
      const star = this.starTex ??= canvasTex(128, 128, (c) => {
        c.fillStyle = '#facc15'; c.strokeStyle = '#b45309'; c.lineWidth = 6; c.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 26 : 58, a = -Math.PI / 2 + (i * Math.PI) / 5; c.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a)); }
        c.closePath(); c.fill(); c.stroke();
      });
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.36 * pk, 0.36 * pk), new THREE.MeshBasicMaterial({ map: star, transparent: true }));
      sm.position.set(s.fw / 2 + bw + mat - 0.05, s.fh / 2 + bw + mat - 0.05, 0.08); g.add(sm);
    }
    this.room.add(g);
    this.frames.set(it.id, { g, s });
  }
  private glowTex?: THREE.Texture;

  /** Viền sáng quanh khung đang chọn (chế độ sắp xếp) */
  setSelected(id: string | null) {
    if (this.selMesh) { this.selMesh.parent?.remove(this.selMesh); this.selMesh.geometry.dispose(); (this.selMesh.material as THREE.Material).dispose(); this.selMesh = null; }
    this.sel = id;
    const f = id ? this.frames.get(id) : null;
    if (!f) return;
    const pk = Math.max(0.55, f.s.k);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(f.s.fw + 0.3 * pk + 0.18, f.s.fh + 0.3 * pk + 0.18), new THREE.MeshBasicMaterial({ color: '#06b6d4' }));
    m.position.z = 0.004;
    f.g.add(m);
    this.selMesh = m;
  }
  private starTex?: THREE.Texture;

  private clearRoom() {
    this.room.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mats = m.material ? (Array.isArray(m.material) ? m.material : [m.material]) : [];
      mats.forEach((x) => x.dispose());
    });
    this.room.clear();
    this.frames.clear();
    this.selMesh = null;
    this.textures.forEach((t) => t.dispose());
    this.textures = [];
    this.glowTex = undefined; this.starTex = undefined;
    this.pickables = [];
  }

  /* ------------------------------------------------------------ camera */
  get size() { return { W: this.layout.W, L: this.layout.L }; }
  get slots() { return this.layout.slots; }
  get layoutInfo(): Layout { return this.layout; }

  private applyCam() {
    this.camera.position.copy(this.pos);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
  private clampPos(p: THREE.Vector3) {
    const { W, L } = this.layout;
    p.x = Math.max(-W / 2 + 0.7, Math.min(W / 2 - 0.7, p.x));
    p.z = Math.max(-L / 2 + 0.7, Math.min(L / 2 - 0.7, p.z));
    return p;
  }
  /** Bay tới trước một khung tranh */
  focus(id: string) {
    const s = this.layout.slots.find((x) => x.id === id);
    if (!s) return;
    // khung treo cao thì đứng xa hơn để không phải ngửa cổ
    const d = Math.max(Math.max(s.fw, s.fh) * 1.05 + 0.9, Math.abs(s.y - EYE) * 1.5);
    const nx = -Math.sin(s.yaw), nz = -Math.cos(s.yaw); // hướng nhìn vào khung
    const target = new THREE.Vector3(s.x - nx * d, EYE, s.z - nz * d);
    this.clampPos(target);
    const pitch = Math.max(-0.25, Math.min(0.42, Math.atan2(s.y - EYE, d) * 0.85));
    this.flyTo(target, s.yaw, pitch);
  }
  /** Đi tới một điểm trên bản đồ nhỏ, giữ hướng nhìn */
  goTo(x: number, z: number) {
    this.flyTo(this.clampPos(new THREE.Vector3(x, EYE, z)), this.yaw, 0);
  }
  private flyTo(p1: THREE.Vector3, yaw: number, pitch: number) {
    let y1 = yaw;
    while (y1 - this.yaw > Math.PI) y1 -= Math.PI * 2;
    while (y1 - this.yaw < -Math.PI) y1 += Math.PI * 2;
    this.fly = { p0: this.pos.clone(), p1, y0: this.yaw, y1, q0: this.pitch, q1: pitch, u: 0 };
  }
  /** Nút điều khiển trên màn hình: f tiến/lùi, s sang ngang, t xoay */
  setMove(f: number, s: number, t = 0) { this.move = { f, s, t }; if (f || s || t) this.fly = null; }
  turn(rad: number) { this.fly = null; this.yaw += rad; }

  private emitPose(force = false) {
    const now = performance.now();
    if (!force && now - this.lastPose < 120) return;
    this.lastPose = now;
    this.cb.onPose?.({ x: this.pos.x, z: this.pos.z, yaw: this.yaw });
  }

  /* ------------------------------------------------------------ sự kiện */
  private onDown = (e: PointerEvent) => {
    this.el.focus({ preventScroll: true });
    this.down = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  private onMoveP = (e: PointerEvent) => {
    if (this.down && this.down.id === e.pointerId) {
      const dx = e.clientX - this.down.x, dy = e.clientY - this.down.y;
      if (!this.down.moved && Math.hypot(dx, dy) > 6) this.down.moved = true;
      if (this.down.moved) {
        this.fly = null;
        const k = e.pointerType === 'touch' ? 0.006 : 0.0045;
        this.yaw += dx * k;
        this.pitch = Math.max(-0.7, Math.min(0.7, this.pitch + dy * k));
        this.down.x = e.clientX; this.down.y = e.clientY;
      }
      return;
    }
    if (e.pointerType === 'mouse') {
      const id = this.pick(e);
      if (id !== this.hovered) { this.hovered = id; this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; this.cb.onHover?.(id); }
    }
  };
  private onUp = (e: PointerEvent) => {
    const d = this.down;
    this.down = null;
    if (!d || d.moved) return;
    const id = this.pick(e);
    if (id) { this.focus(id); this.cb.onOpen(id); }
  };
  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.fly = null;
    const step = Math.max(-1, Math.min(1, -e.deltaY / 120)) * 0.6;
    this.pos.x += -Math.sin(this.yaw) * step;
    this.pos.z += -Math.cos(this.yaw) * step;
    this.clampPos(this.pos);
  };
  private onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e'].includes(k)) { e.preventDefault(); this.keys.add(k); this.fly = null; }
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); };
  private clearKeys = () => { this.keys.clear(); };
  private onVis = () => { if (document.hidden) { cancelAnimationFrame(this.raf); this.raf = 0; } else if (!this.raf && !this.disposed) { this.last = performance.now(); this.loop(); } };

  private pick(e: PointerEvent): string | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(v, this.camera);
    const hit = this.ray.intersectObjects(this.pickables, false)[0];
    return hit ? (hit.object.userData.id as string) : null;
  }

  private resize() {
    const w = Math.max(1, this.el.clientWidth), h = Math.max(1, this.el.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.9 ? 75 : 62; // điện thoại dựng đứng: nhìn rộng hơn
    this.camera.updateProjectionMatrix();
  }

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const k = this.keys;
    let f = this.move.f, s = this.move.s, tr = this.move.t;
    if (k.has('arrowup') || k.has('w')) f += 1;
    if (k.has('arrowdown') || k.has('s')) f -= 1;
    if (k.has('a')) s -= 1;
    if (k.has('d')) s += 1;
    if (k.has('arrowleft') || k.has('q')) tr += 1;
    if (k.has('arrowright') || k.has('e')) tr -= 1;
    if (this.fly) {
      const fl = this.fly;
      fl.u = Math.min(1, fl.u + dt / 0.75);
      const e = fl.u < 0.5 ? 2 * fl.u * fl.u : 1 - (-2 * fl.u + 2) ** 2 / 2;
      this.pos.lerpVectors(fl.p0, fl.p1, e);
      this.yaw = fl.y0 + (fl.y1 - fl.y0) * e;
      this.pitch = fl.q0 + (fl.q1 - fl.q0) * e;
      if (fl.u >= 1) this.fly = null;
    } else if (f || s || tr) {
      this.yaw += tr * dt * 1.6;
      const sp = 3.2 * dt;
      this.pos.x += (-Math.sin(this.yaw) * f + Math.cos(this.yaw) * s) * sp;
      this.pos.z += (-Math.cos(this.yaw) * f - Math.sin(this.yaw) * s) * sp;
      this.clampPos(this.pos);
    }
    this.applyCam();
    this.emitPose();
    this.renderer.render(this.scene, this.camera);
  };

  /** Ảnh chụp màn hình phòng (để làm ảnh xem trước) */
  snapshot(): string { this.renderer.render(this.scene, this.camera); return this.renderer.domElement.toDataURL('image/jpeg', 0.85); }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    const cv = this.renderer.domElement;
    cv.removeEventListener('pointerdown', this.onDown);
    cv.removeEventListener('pointermove', this.onMoveP);
    cv.removeEventListener('pointerup', this.onUp);
    cv.removeEventListener('pointercancel', this.onUp);
    cv.removeEventListener('wheel', this.onWheel);
    this.el.removeEventListener('keydown', this.onKey);
    this.el.removeEventListener('keyup', this.onKeyUp);
    this.el.removeEventListener('blur', this.clearKeys);
    document.removeEventListener('visibilitychange', this.onVis);
    this.clearRoom();
    this.imgCache.forEach((t) => t.dispose());
    this.imgCache.clear();
    this.renderer.dispose();
    cv.remove();
  }
}

/** Trình duyệt có WebGL không (máy quá yếu / tắt tăng tốc phần cứng thì dùng dạng lưới) */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}
