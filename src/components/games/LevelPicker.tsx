'use client';

import { GAME_LEVELS, LEVEL_INFO, LEVEL_NOTE, type GameLevel } from '@/lib/games/catalog';

type Props = {
  value: GameLevel;
  onChange: (level: GameLevel) => void;
  /** Mô tả ngắn cấp độ đang chọn làm gì khó hơn (ví dụ "6 cặp thẻ") */
  detail?: (level: GameLevel) => string;
};

/** Chọn cấp độ L1–L5 bằng nhóm nút radio thật (dùng được phím mũi tên, Tab, trình đọc màn hình) */
export default function LevelPicker({ value, onChange, detail }: Props) {
  return (
    <fieldset className="level-picker">
      <legend>Cấp độ thử thách</legend>
      <div className="level-options">
        {GAME_LEVELS.map((lv) => (
          <label key={lv} className="level-option">
            <input type="radio" name="game-level" value={lv} checked={value === lv} onChange={() => onChange(lv)} />
            <span className="level-chip">
              <strong>L{lv}</strong>
              <span>{LEVEL_INFO[lv].name}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="level-detail">
        <strong>L{value} · {LEVEL_INFO[value].name}:</strong> {detail ? detail(value) : LEVEL_INFO[value].hint}
      </p>
      <p className="level-note">{LEVEL_NOTE}</p>
    </fieldset>
  );
}

/** Ghi cấp độ vào địa chỉ trang (để tải lại vẫn giữ), không tạo thêm lịch sử duyệt */
export function rememberLevel(level: GameLevel) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('cap', String(level));
    window.history.replaceState(window.history.state, '', url);
  } catch {
    // Bỏ qua: không ảnh hưởng tới việc chơi
  }
}
