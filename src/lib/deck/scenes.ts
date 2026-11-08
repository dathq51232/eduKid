import { f3dSrc } from './f3d-catalog';
import type { SceneKind, SceneVariant } from './types';

/** Cảnh nền minh hoạ đa góc máy (chuẩn Canva Storybook): mỗi chủ đề có 5 góc máy (cover, center, right, left, bottom) */
export type ScenePart = { src?: string; x: number; y: number; w: number; h?: number; css?: string; op?: number; flip?: boolean; rot?: number };
export type SceneInk = { title: string; sub: string; body: string; pill: string; pillBorder: string };
export type Scene = {
  id: SceneKind;
  label: string;
  icon: string;
  bg: string;
  bgInner?: string;
  dark?: boolean;
  ink: SceneInk;
  parts: ScenePart[];
  variants?: Partial<Record<SceneVariant, ScenePart[]>>;
};

export const SCENE_VARIANTS: { id: SceneVariant; label: string; short: string }[] = [
  { id: 'cover', label: '🏞️ Bìa (Cảnh phải · Chữ trái)', short: 'Bìa' },
  { id: 'center', label: '🖼️ Dẫn nhập (Chữ giữa · Cảnh viền)', short: 'Giữa' },
  { id: 'right', label: '🐋 Cảnh Phải · Chữ Trái', short: 'Cảnh phải' },
  { id: 'left', label: '🐬 Cảnh Trái · Chữ Phải', short: 'Cảnh trái' },
  { id: 'bottom', label: '🪸 Cảnh Đáy · Chữ Trên', short: 'Cảnh đáy' },
];

const S = f3dSrc;

export const SCENES: Scene[] = [
  {
    id: 'sea',
    label: 'Đại dương',
    icon: '🌊',
    bg: 'linear-gradient(180deg,#ccf2ff 0%,#dcf7ff 55%,#6bc4d8 55%,#52b2c7 100%)',
    bgInner: 'linear-gradient(180deg,#c2f2fc 0%,#88d9ec 58%,#4eb6cf 100%)',
    ink: { title: '#035397', sub: '#0077b6', body: '#0c4a6e', pill: 'rgba(255,255,255,0.78)', pillBorder: '#7dd3fc' },
    // cover: vẽ hoàn chỉnh bằng SVG phong cảnh bờ biển đảo dừa + hải cẩu + cá heo trong SceneBg
    parts: [],
    variants: {
      cover: [],
      center: [
        { src: S('dolphin'), x: 1290, y: 480, w: 185, flip: true },
        { src: S('tropical-fish'), x: 110, y: 200, w: 110 },
        { src: S('fish'), x: 1360, y: 180, w: 110, flip: true },
        { src: S('crab'), x: 640, y: 765, w: 105 },
      ],
      right: [
        { src: S('spouting-whale'), x: 980, y: 170, w: 380, flip: true },
        { src: S('spouting-whale'), x: 1120, y: 470, w: 310, flip: true },
        { src: S('tropical-fish'), x: 910, y: 420, w: 110 },
        { src: S('fish'), x: 1380, y: 120, w: 95, flip: true },
      ],
      left: [
        { src: S('dolphin'), x: 140, y: 130, w: 280 },
        { src: S('turtle'), x: 110, y: 440, w: 230 },
        { src: S('squid'), x: 430, y: 500, w: 175 },
        { src: S('tropical-fish'), x: 420, y: 280, w: 115 },
      ],
      bottom: [
        { src: S('crab'), x: 520, y: 735, w: 120 },
        { src: S('crab'), x: 760, y: 755, w: 100 },
        { src: S('dolphin'), x: 1280, y: 490, w: 230, flip: true },
        { src: S('tropical-fish'), x: 240, y: 580, w: 110 },
        { src: S('fish'), x: 980, y: 600, w: 105, flip: true },
      ],
    },
  },
  {
    id: 'garden',
    label: 'Rừng xanh',
    icon: '🌳',
    bg: 'linear-gradient(180deg,#d8f3dc 0%,#f1faee 58%,#95d5b2 58%,#52b788 100%)',
    bgInner: 'linear-gradient(180deg,#e9f7ec 0%,#d8f3dc 64%,#74c69d 100%)',
    ink: { title: '#14532d', sub: '#15803d', body: '#1e3a2f', pill: 'rgba(255,255,255,0.82)', pillBorder: '#86efac' },
    parts: [
      { src: S('deciduous-tree'), x: 1080, y: 80, w: 460 },
      { src: S('deer'), x: 920, y: 460, w: 230, flip: true },
      { src: S('rabbit'), x: 640, y: 630, w: 155 },
      { src: S('squirrel'), x: 1280, y: 620, w: 150, flip: true },
      { src: S('butterfly'), x: 780, y: 220, w: 110 },
      { src: S('sunflower'), x: 1440, y: 680, w: 120 },
    ],
    variants: {
      center: [
        { src: S('deciduous-tree'), x: -30, y: 360, w: 260 },
        { src: S('deciduous-tree'), x: 1360, y: 380, w: 260 },
        { src: S('rabbit'), x: 160, y: 680, w: 150 },
        { src: S('butterfly'), x: 1320, y: 160, w: 110 },
      ],
      right: [
        { src: S('deciduous-tree'), x: 1120, y: 110, w: 420 },
        { src: S('deer'), x: 930, y: 420, w: 260, flip: true },
        { src: S('rabbit'), x: 1240, y: 590, w: 170, flip: true },
        { src: S('butterfly'), x: 960, y: 180, w: 110 },
      ],
      left: [
        { src: S('deciduous-tree'), x: 40, y: 100, w: 420 },
        { src: S('fox'), x: 360, y: 470, w: 220 },
        { src: S('squirrel'), x: 120, y: 580, w: 170 },
        { src: S('sunflower'), x: 560, y: 650, w: 130 },
      ],
      bottom: [
        { src: S('sunflower'), x: 140, y: 680, w: 135 },
        { src: S('rabbit'), x: 420, y: 690, w: 150 },
        { src: S('hedgehog'), x: 820, y: 730, w: 125 },
        { src: S('deer'), x: 1280, y: 560, w: 220, flip: true },
        { src: S('butterfly'), x: 1120, y: 540, w: 100 },
      ],
    },
  },
  {
    id: 'farm',
    label: 'Nông trại',
    icon: '🌾',
    bg: 'linear-gradient(180deg,#dbeafe 0%,#f0f9ff 56%,#bbf7d0 56%,#86efac 100%)',
    bgInner: 'linear-gradient(180deg,#e0f2fe 0%,#f0fdf4 62%,#86efac 100%)',
    ink: { title: '#9a3412', sub: '#b45309', body: '#431407', pill: 'rgba(255,255,255,0.82)', pillBorder: '#fcd34d' },
    parts: [
      { src: S('sun'), x: 1380, y: 40, w: 160 },
      { src: S('house'), x: 1080, y: 210, w: 380 },
      { src: S('cow'), x: 820, y: 490, w: 240, flip: true },
      { src: S('pig'), x: 1140, y: 580, w: 185, flip: true },
      { src: S('rooster'), x: 560, y: 640, w: 155 },
      { src: S('chick'), x: 740, y: 730, w: 95 },
    ],
    variants: {
      center: [
        { src: S('rooster'), x: 90, y: 630, w: 165 },
        { src: S('pig'), x: 1340, y: 630, w: 175, flip: true },
        { src: S('ear-of-corn'), x: 270, y: 720, w: 110 },
        { src: S('carrot'), x: 1210, y: 730, w: 110 },
      ],
      right: [
        { src: S('tractor'), x: 1020, y: 240, w: 340, flip: true },
        { src: S('cow'), x: 940, y: 540, w: 240, flip: true },
        { src: S('ewe'), x: 1250, y: 570, w: 210, flip: true },
      ],
      left: [
        { src: S('house'), x: 90, y: 210, w: 350 },
        { src: S('pig'), x: 430, y: 500, w: 200 },
        { src: S('rooster'), x: 140, y: 590, w: 170 },
        { src: S('chick'), x: 340, y: 690, w: 105 },
      ],
      bottom: [
        { src: S('rooster'), x: 120, y: 660, w: 155 },
        { src: S('chick'), x: 310, y: 740, w: 95 },
        { src: S('ear-of-corn'), x: 640, y: 720, w: 115 },
        { src: S('carrot'), x: 820, y: 730, w: 115 },
        { src: S('cow'), x: 1270, y: 590, w: 230, flip: true },
      ],
    },
  },
  {
    id: 'dino',
    label: 'Khủng long',
    icon: '🦖',
    bg: 'linear-gradient(180deg,#ccfbf1 0%,#e6fffa 55%,#a7f3d0 55%,#34d399 100%)',
    bgInner: 'linear-gradient(180deg,#d1fae5 0%,#ecfdf5 62%,#6ee7b7 100%)',
    ink: { title: '#115e59', sub: '#0f766e', body: '#134e4a', pill: 'rgba(255,255,255,0.82)', pillBorder: '#5eead4' },
    parts: [
      { src: S('dino'), x: 940, y: 240, w: 460, flip: true },
      { src: S('turtle'), x: 620, y: 660, w: 170 },
      { src: S('chameleon'), x: 1350, y: 620, w: 175, flip: true },
      { src: S('cactus'), x: 820, y: 520, w: 150 },
    ],
    variants: {
      center: [
        { src: S('dino'), x: 70, y: 520, w: 270 },
        { src: S('cactus'), x: 1360, y: 560, w: 170 },
        { src: S('butterfly'), x: 1300, y: 160, w: 110 },
      ],
      right: [
        { src: S('dino'), x: 960, y: 210, w: 470, flip: true },
        { src: S('cactus'), x: 1380, y: 540, w: 160 },
        { src: S('turtle'), x: 920, y: 640, w: 175, flip: true },
      ],
      left: [
        { src: S('dino'), x: 110, y: 220, w: 460 },
        { src: S('chameleon'), x: 480, y: 590, w: 185 },
        { src: S('cactus'), x: 60, y: 560, w: 155 },
      ],
      bottom: [
        { src: S('cactus'), x: 120, y: 620, w: 160 },
        { src: S('turtle'), x: 480, y: 700, w: 165 },
        { src: S('chameleon'), x: 880, y: 700, w: 165, flip: true },
        { src: S('dino'), x: 1240, y: 520, w: 290, flip: true },
      ],
    },
  },
  {
    id: 'space',
    label: 'Vũ trụ',
    icon: '🚀',
    dark: true,
    bg: 'radial-gradient(circle at 78% 22%,#3b3f8f 0%,#1e1b4b 45%,#0b1026 100%)',
    bgInner: 'radial-gradient(circle at 50% 20%,#312e81 0%,#1e1b4b 55%,#090d24 100%)',
    ink: { title: '#fef08a', sub: '#7dd3fc', body: '#f8fafc', pill: 'rgba(30,41,59,0.78)', pillBorder: '#818cf8' },
    parts: [
      { src: S('planet'), x: 1020, y: 120, w: 380 },
      { src: S('rocket'), x: 780, y: 360, w: 260 },
      { src: S('moon'), x: 1340, y: 460, w: 190 },
      { src: S('star'), x: 620, y: 160, w: 95 },
      { src: S('star'), x: 1420, y: 90, w: 80 },
    ],
    variants: {
      center: [
        { src: S('moon'), x: 90, y: 90, w: 160 },
        { src: S('planet'), x: 1300, y: 540, w: 230 },
        { src: S('rocket'), x: 90, y: 580, w: 200 },
      ],
      right: [
        { src: S('planet'), x: 980, y: 140, w: 390 },
        { src: S('rocket'), x: 1120, y: 490, w: 260 },
        { src: S('star'), x: 920, y: 420, w: 95 },
      ],
      left: [
        { src: S('rocket'), x: 140, y: 160, w: 320 },
        { src: S('planet'), x: 260, y: 470, w: 320 },
        { src: S('moon'), x: 80, y: 520, w: 170 },
      ],
      bottom: [
        { src: S('moon'), x: 1400, y: 60, w: 140 },
        { src: S('rocket'), x: 1260, y: 540, w: 240 },
        { src: S('planet'), x: 120, y: 600, w: 230 },
        { src: S('star'), x: 680, y: 720, w: 100 },
      ],
    },
  },
  {
    id: 'class',
    label: 'Lớp học',
    icon: '🏫',
    bg: 'linear-gradient(180deg,#fef3c7 0%,#fffbeb 66%,#e2b170 66%,#c99456 100%)',
    bgInner: 'linear-gradient(180deg,#fffbeb 0%,#fef3c7 70%,#d6a266 100%)',
    ink: { title: '#92400e', sub: '#b45309', body: '#451a03', pill: 'rgba(255,255,255,0.85)', pillBorder: '#fbbf24' },
    parts: [
      { src: S('school'), x: 980, y: 180, w: 460 },
      { src: S('books'), x: 760, y: 580, w: 190 },
      { src: S('backpack'), x: 1320, y: 560, w: 200 },
      { src: S('pencil'), x: 580, y: 640, w: 145 },
    ],
    variants: {
      center: [
        { src: S('books'), x: 80, y: 640, w: 170 },
        { src: S('backpack'), x: 1350, y: 620, w: 180 },
        { src: S('light-bulb'), x: 1380, y: 90, w: 110 },
      ],
      right: [
        { src: S('open-book'), x: 980, y: 190, w: 340 },
        { src: S('backpack'), x: 1220, y: 490, w: 240 },
        { src: S('pencil'), x: 940, y: 540, w: 180 },
      ],
      left: [
        { src: S('school'), x: 100, y: 200, w: 390 },
        { src: S('books'), x: 380, y: 550, w: 200 },
        { src: S('straight-ruler'), x: 120, y: 590, w: 170 },
      ],
      bottom: [
        { src: S('books'), x: 120, y: 670, w: 165 },
        { src: S('pencil'), x: 380, y: 690, w: 140 },
        { src: S('straight-ruler'), x: 1080, y: 690, w: 150 },
        { src: S('backpack'), x: 1320, y: 630, w: 190 },
      ],
    },
  },
  {
    id: 'yard',
    label: 'Sân nhà',
    icon: '🏡',
    bg: 'linear-gradient(180deg,#c7e9ff 0%,#eef8ff 58%,#fde68a 58%,#f59e0b 100%)',
    bgInner: 'linear-gradient(180deg,#e0f2fe 0%,#f8fafc 62%,#fcd34d 100%)',
    ink: { title: '#9a3412', sub: '#d97706', body: '#431407', pill: 'rgba(255,255,255,0.82)', pillBorder: '#fbbf24' },
    parts: [
      { src: S('house'), x: 1020, y: 170, w: 440 },
      { src: S('dog'), x: 780, y: 580, w: 190 },
      { src: S('cat'), x: 1320, y: 620, w: 165, flip: true },
      { src: S('balloon'), x: 920, y: 90, w: 135 },
    ],
    variants: {
      center: [
        { src: S('dog'), x: 100, y: 640, w: 170 },
        { src: S('cat'), x: 1340, y: 650, w: 160, flip: true },
        { src: S('balloon'), x: 1380, y: 80, w: 130 },
      ],
      right: [
        { src: S('house'), x: 1000, y: 180, w: 420 },
        { src: S('dog'), x: 940, y: 560, w: 195, flip: true },
        { src: S('cat'), x: 1260, y: 590, w: 175, flip: true },
      ],
      left: [
        { src: S('house'), x: 90, y: 180, w: 410 },
        { src: S('dog'), x: 420, y: 550, w: 195 },
        { src: S('kite'), x: 460, y: 110, w: 165 },
      ],
      bottom: [
        { src: S('dog'), x: 140, y: 660, w: 175 },
        { src: S('soccer-ball'), x: 420, y: 740, w: 115 },
        { src: S('cat'), x: 1290, y: 660, w: 165, flip: true },
      ],
    },
  },
  {
    id: 'kitchen',
    label: 'Tiệm bánh',
    icon: '🍳',
    bg: 'linear-gradient(180deg,#ffe4e6 0%,#fff1f2 62%,#fed7aa 62%,#fDBA74 100%)',
    bgInner: 'linear-gradient(180deg,#fff1f2 0%,#fff7ed 66%,#fed7aa 100%)',
    ink: { title: '#9f1239', sub: '#e11d48', body: '#4c0519', pill: 'rgba(255,255,255,0.84)', pillBorder: '#fda4af' },
    parts: [
      { src: S('birthday-cake'), x: 1020, y: 240, w: 340 },
      { src: S('cupcake'), x: 780, y: 560, w: 190 },
      { src: S('strawberry'), x: 1340, y: 560, w: 165 },
      { src: S('icecream'), x: 600, y: 610, w: 165 },
    ],
    variants: {
      center: [
        { src: S('cupcake'), x: 90, y: 640, w: 165 },
        { src: S('strawberry'), x: 1350, y: 650, w: 155 },
      ],
      right: [
        { src: S('birthday-cake'), x: 1000, y: 220, w: 340 },
        { src: S('icecream'), x: 930, y: 540, w: 185 },
        { src: S('strawberry'), x: 1260, y: 560, w: 170 },
      ],
      left: [
        { src: S('birthday-cake'), x: 120, y: 220, w: 330 },
        { src: S('cupcake'), x: 420, y: 530, w: 190 },
        { src: S('orange'), x: 130, y: 580, w: 160 },
      ],
      bottom: [
        { src: S('red-apple'), x: 140, y: 690, w: 145 },
        { src: S('banana'), x: 380, y: 690, w: 145 },
        { src: S('strawberry'), x: 1080, y: 690, w: 145 },
        { src: S('cupcake'), x: 1300, y: 640, w: 175 },
      ],
    },
  },
  {
    id: 'pond',
    label: 'Ao sen',
    icon: '🪷',
    bg: 'linear-gradient(180deg,#cffafe 0%,#ecfeff 52%,#67e8f9 52%,#06b6d4 100%)',
    bgInner: 'linear-gradient(180deg,#e0f2fe 0%,#bae6fd 58%,#38bdf8 100%)',
    ink: { title: '#075985', sub: '#0284c7', body: '#0c4a6e', pill: 'rgba(255,255,255,0.82)', pillBorder: '#7dd3fc' },
    parts: [
      { src: S('duck'), x: 1040, y: 420, w: 250, flip: true },
      { src: S('frog'), x: 680, y: 590, w: 185 },
      { src: S('fish'), x: 1280, y: 670, w: 160, flip: true },
      { src: S('blossom'), x: 920, y: 640, w: 130 },
    ],
    variants: {
      center: [
        { src: S('duck'), x: 1320, y: 580, w: 195, flip: true },
        { src: S('frog'), x: 90, y: 630, w: 165 },
      ],
      right: [
        { src: S('duck'), x: 980, y: 280, w: 260, flip: true },
        { src: S('frog'), x: 1180, y: 550, w: 210, flip: true },
        { src: S('fish'), x: 920, y: 620, w: 160 },
      ],
      left: [
        { src: S('duck'), x: 140, y: 290, w: 260 },
        { src: S('frog'), x: 380, y: 550, w: 200 },
        { src: S('fish'), x: 120, y: 640, w: 160 },
      ],
      bottom: [
        { src: S('frog'), x: 140, y: 660, w: 170 },
        { src: S('fish'), x: 560, y: 720, w: 145 },
        { src: S('duck'), x: 1260, y: 590, w: 210, flip: true },
      ],
    },
  },
  {
    id: 'candy',
    label: 'Kẹo ngọt',
    icon: '🍭',
    bg: 'linear-gradient(180deg,#fdf2f8 0%,#fce7f3 58%,#fbcfe8 58%,#f9a8d4 100%)',
    bgInner: 'linear-gradient(180deg,#fdf4ff 0%,#fce7f3 64%,#f5d0fe 100%)',
    ink: { title: '#9d174d', sub: '#db2777', body: '#500724', pill: 'rgba(255,255,255,0.85)', pillBorder: '#f9a8d4' },
    parts: [
      { src: S('rainbow'), x: 980, y: 80, w: 480 },
      { src: S('icecream'), x: 860, y: 470, w: 230 },
      { src: S('cupcake'), x: 1160, y: 520, w: 220 },
      { src: S('balloon'), x: 680, y: 220, w: 150 },
      { src: S('star'), x: 1380, y: 420, w: 130 },
    ],
    variants: {
      center: [
        { src: S('balloon'), x: 90, y: 120, w: 145 },
        { src: S('icecream'), x: 1340, y: 580, w: 185 },
        { src: S('cupcake'), x: 100, y: 620, w: 175 },
      ],
      right: [
        { src: S('rainbow'), x: 980, y: 110, w: 460 },
        { src: S('icecream'), x: 960, y: 480, w: 220 },
        { src: S('cupcake'), x: 1220, y: 520, w: 210 },
      ],
      left: [
        { src: S('rainbow'), x: 80, y: 110, w: 460 },
        { src: S('icecream'), x: 140, y: 480, w: 220 },
        { src: S('wrapped-gift'), x: 400, y: 520, w: 200 },
      ],
      bottom: [
        { src: S('icecream'), x: 120, y: 630, w: 175 },
        { src: S('cupcake'), x: 420, y: 660, w: 165 },
        { src: S('wrapped-gift'), x: 1280, y: 630, w: 185 },
      ],
    },
  },
  {
    id: 'tet',
    label: 'Ngày Tết',
    icon: '🧧',
    dark: true,
    bg: 'radial-gradient(circle at 35% 35%,#ef4444 0%,#b91c1c 62%,#7f1d1d 100%)',
    bgInner: 'radial-gradient(circle at 50% 30%,#dc2626 0%,#991b1b 68%,#7f1d1d 100%)',
    ink: { title: '#fef08a', sub: '#fde68a', body: '#fffbeb', pill: 'rgba(127,29,29,0.78)', pillBorder: '#fbbf24' },
    parts: [
      { src: S('red-paper-lantern'), x: 1360, y: 10, w: 170 },
      { src: S('red-paper-lantern'), x: 1140, y: -10, w: 140 },
      { src: S('blossom'), x: 980, y: 340, w: 280 },
      { src: S('red-envelope'), x: 760, y: 560, w: 195 },
      { src: S('wrapped-gift'), x: 1260, y: 580, w: 210 },
    ],
    variants: {
      center: [
        { src: S('red-paper-lantern'), x: 60, y: 0, w: 150 },
        { src: S('red-paper-lantern'), x: 1390, y: 0, w: 150 },
        { src: S('blossom'), x: 60, y: 660, w: 175 },
        { src: S('red-envelope'), x: 1360, y: 660, w: 165 },
      ],
      right: [
        { src: S('red-paper-lantern'), x: 1320, y: 10, w: 165 },
        { src: S('blossom'), x: 980, y: 240, w: 290 },
        { src: S('red-envelope'), x: 1180, y: 530, w: 220 },
      ],
      left: [
        { src: S('red-paper-lantern'), x: 100, y: 10, w: 165 },
        { src: S('blossom'), x: 140, y: 240, w: 280 },
        { src: S('red-envelope'), x: 360, y: 530, w: 210 },
      ],
      bottom: [
        { src: S('red-paper-lantern'), x: 60, y: 0, w: 140 },
        { src: S('red-paper-lantern'), x: 1400, y: 0, w: 140 },
        { src: S('blossom'), x: 120, y: 660, w: 175 },
        { src: S('red-envelope'), x: 1280, y: 650, w: 175 },
      ],
    },
  },
];

/** màu nhấn của mỗi chủ đề (khung nội dung, nhãn bài, chữ trang chia) */
export const ACCENT: Record<string, string> = {
  sea: '#035397',
  garden: '#15803d',
  farm: '#b45309',
  dino: '#0f766e',
  space: '#7c3aed',
  class: '#b45309',
  yard: '#d97706',
  kitchen: '#e11d48',
  pond: '#0284c7',
  candy: '#db2777',
  tet: '#dc2626',
};
export const accentOf = (id?: string) => (id && ACCENT[id]) || '#035397';
export const SCENE_BY_ID: Record<string, Scene> = Object.fromEntries(SCENES.map((s) => [s.id, s]));
export const sceneDark = (id?: string) => !!(id && SCENE_BY_ID[id]?.dark);
export const inkOf = (id?: string): SceneInk =>
  (id && SCENE_BY_ID[id]?.ink) || { title: '#035397', sub: '#0077b6', body: '#0f172a', pill: 'rgba(255,255,255,0.82)', pillBorder: '#7dd3fc' };

const KEYS: [SceneKind, string][] = [
  ['sea', 'biển|đại dương|sóng|tàu|đảo|cua|cá voi|cá heo|san hô|hải cẩu|sea|ocean|beach|dolphin|whale'],
  ['pond', 'cá|ao|vịt|ếch|nước|sông|hồ|sen|thuyền'],
  ['tet', 'tết|lì xì|bánh chưng|năm mới|hoa đào|hoa mai|đón tết|mùa xuân|lễ hội'],
  ['space', 'ngôi sao|trăng|vũ trụ|tên lửa|hành tinh|đêm|space|moon|star|planet'],
  ['dino', 'khủng long|cổ đại|rừng nhiệt đới|dino|dinosaur'],
  ['farm', 'gà|lợn|heo|bò|trâu|cừu|ngô|lúa|trang trại|nông|farm|animal|chicken|cow'],
  ['kitchen', 'bếp|nấu|cơm|bánh|kẹo|kem|đĩa|bát|cam|chuối|kg|lít|ăn|food|fruit|lunch|breakfast|kitchen|cake'],
  ['candy', 'kẹo|ngọt|cầu vồng|sinh nhật|ước mơ|cổ tích|party|candy|rainbow'],
  ['garden', 'táo|hoa|cây|vườn|rừng|lá|bướm|ong|thỏ|hươu|sóc|garden|forest|flower|tree'],
  ['class', 'lớp|bút|sách|vở|thước|trường|cô giáo|thầy|bạn bè|school|class|pen|book|ruler'],
  ['yard', 'nhà|sân|chó|mèo|bóng|đồ chơi|gia đình|bố|mẹ|home|family|toy|pet'],
];
/** Chọn cảnh theo nội dung bài (đếm từ khoá), mặc định: Đại dương hoặc Khu rừng */
export function pickScene(text: string, fallback: SceneKind = 'garden'): SceneKind {
  const t = ` ${text.toLowerCase().replace(/cá nhân|cá thể|nước ta|đất nước/g, ' ')} `;
  let best: SceneKind = fallback, n = 0;
  for (const [k, re] of KEYS) {
    const m = t.match(new RegExp(`(?<!\\p{L})(${re})(?!\\p{L})`, 'giu'))?.length ?? 0;
    if (m > n) { n = m; best = k; }
  }
  return best;
}
