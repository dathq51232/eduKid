// Tra cứu danh mục chương trình cho mọi lớp (gộp lớp 1, lớp 2…). Thêm lớp mới: tạo gradeN.ts rồi thêm vào đây.
import { FORMS, TOPICS, type ExerciseForm, type Topic } from './grade1';
import { FORMS2, TOPICS2 } from './grade2';
import { FORMS3, TOPICS3 } from './grade3';
import { FORMS4, TOPICS4 } from './grade4';
import { FORMS5, TOPICS5 } from './grade5';
import type { SubjectCode } from '../types';

export const TOPICS_BY_GRADE: Record<number, Record<SubjectCode, Topic[]>> = { 1: TOPICS, 2: TOPICS2, 3: TOPICS3, 4: TOPICS4, 5: TOPICS5 };

/** Dạng bài của môn (mọi lớp) */
export function formsOf(subject: SubjectCode): ExerciseForm[] {
  return [...FORMS[subject], ...FORMS2[subject], ...FORMS3[subject], ...FORMS4[subject], ...FORMS5[subject]];
}

/** YCCĐ theo mã, tìm ở mọi lớp */
export function findOutcomeAny(subject: SubjectCode, code: string | undefined) {
  for (const topics of Object.values(TOPICS_BY_GRADE)) {
    for (const t of topics[subject]) {
      const o = t.outcomes.find((x) => x.code === code);
      if (o) return { topic: t, outcome: o };
    }
  }
  return undefined;
}
