'use client';

import { X } from 'lucide-react';

type Props = { reason: 'unsupported' | 'no_vi_voice'; onClose: () => void };

// Báo khi máy chưa đọc được tiếng Việt, kèm cách khắc phục. Lời nhắn dành cho phụ huynh/thầy cô.
export default function VoiceHelp({ reason, onClose }: Props) {
  return (
    <div className="voice-help" role="status">
      <button type="button" className="voice-help-x" aria-label="Đóng" onClick={onClose}>
        <X size={18} aria-hidden="true" />
      </button>
      {reason === 'unsupported' ? (
        <p><strong>Trình duyệt này không hỗ trợ đọc đề.</strong> Hãy mở bằng Microsoft Edge, Google Chrome hoặc Safari bản mới.</p>
      ) : (
        <>
          <p><strong>Máy chưa có giọng đọc tiếng Việt</strong>, nên chưa đọc đề được (để tránh đọc sai bằng giọng tiếng Anh).</p>
          <ul>
            <li><strong>Nhanh nhất trên máy tính:</strong> mở trang bằng <strong>Microsoft Edge</strong> (có sẵn giọng Hoài My).</li>
            <li><strong>Windows + Chrome:</strong> Cài đặt → Thời gian và ngôn ngữ → Giọng nói → Thêm giọng nói → Tiếng Việt, rồi mở lại trình duyệt.</li>
            <li><strong>Điện thoại Android:</strong> Cài đặt → Hệ thống → Ngôn ngữ → Chuyển văn bản thành giọng nói → Công cụ của Google → tải Tiếng Việt.</li>
            <li><strong>iPhone, iPad:</strong> Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt (Linh).</li>
          </ul>
        </>
      )}
    </div>
  );
}
