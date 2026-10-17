// Kiểu dữ liệu trang Thành tích (API /api/thanh-tich, migration 0012).
export type BoardRow = { rank: number; display_name: string; points: number; lessons: number; is_me: boolean };
export type MyAchievements = {
  display_name: string; class_id: string | null; class_name: string | null;
  total_points: number; week_points: number; month_points: number;
  lessons_done: number; lessons_week: number; perfect_lessons: number; games_played: number; last_activity: string | null;
};
export type AchievementsPayload = { me: MyAchievements | null; classId: string | null; week: BoardRow[]; month: BoardRow[]; at: string };

