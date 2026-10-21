// Milo đổi trang phục theo môn học và theo game (ảnh nền trong suốt trong public/brand/milo-<tên>.webp + bản -sm).
import type { MiloVariant } from '@/components/mascot/MiloMascot';
import type { GameId } from '@/lib/games/catalog';
import type { SubjectCode } from '@/lib/types';

export const MASCOT_NAME: Record<MiloVariant, string> = {
  default: 'Milo',
  robot: 'Milo robot',
  artist: 'Milo họa sĩ',
  professor: 'Milo giáo sư',
  astronaut: 'Milo phi hành gia',
  doctor: 'Milo bác sĩ',
};

/** Trang làm bài: Toán – giáo sư (biểu đồ, số liệu); Tiếng Việt – họa sĩ (sáng tạo, viết, kể); Tiếng Anh – phi hành gia (khám phá thế giới) */
export const SUBJECT_MASCOT: Record<SubjectCode, MiloVariant> = {
  toan: 'professor',
  'tieng-viet': 'artist',
  'tieng-anh': 'astronaut',
};

/** Game trí tuệ */
export const GAME_MASCOT: Record<GameId, MiloVariant> = {
  pattern: 'artist',
  memory: 'default',
  maze: 'astronaut',
  sudoku: 'professor',
  balance: 'doctor',
};
