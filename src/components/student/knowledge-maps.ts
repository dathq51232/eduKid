// Bản đồ kiến thức Toán theo khối (lớp 1–5).
import { MAP_TOAN1 } from './knowledge-map-toan1';
import { MAP_TOAN2 } from './knowledge-map-toan2';
import { MAP_TOAN3 } from './knowledge-map-toan3';
import { MAP_TOAN4 } from './knowledge-map-toan4';
import { MAP_TOAN5 } from './knowledge-map-toan5';
import type { MapDef } from './knowledge-map-types';

export const MAPS: Record<number, MapDef> = { 1: MAP_TOAN1, 2: MAP_TOAN2, 3: MAP_TOAN3, 4: MAP_TOAN4, 5: MAP_TOAN5 };
