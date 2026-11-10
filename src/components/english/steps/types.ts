import type { Dispatch } from 'react';
import type { LessonAction, LessonData, LessonState } from '@/components/english/lesson';

/** Props chung của các bước trong bài học. */
export type StepProps = {
  lesson: LessonData;
  state: LessonState;
  dispatch: Dispatch<LessonAction>;
  /** Đang phát câu mẫu. */
  speaking: boolean;
  /** Bật/tắt câu mẫu chuẩn của câu đang học. */
  toggleSample: () => void;
  /** Phát một câu bất kỳ (huỷ lượt đo phản xạ đang chạy). */
  speak: (text: string) => void;
  /** Sang bước khác (dừng âm thanh + micro). */
  goStep: (step: number) => void;
};
