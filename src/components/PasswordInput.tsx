'use client';

// Ô mật khẩu có nút con mắt để hiện / ẩn chữ đã gõ (tránh gõ nhầm phím, sai bộ gõ tiếng Việt).
// Dùng bên trong <label className="adm-field"> như ô nhập thường.
import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function PasswordInput(props: Props) {
  const [show, setShow] = useState(false);
  return (
    <span className="pw-field">
      <input {...props} type={show ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      <button
        type="button"
        className="pw-eye"
        aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={show}
        title={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        onMouseDown={(e) => e.preventDefault()} // giữ con trỏ trong ô nhập
        onClick={(e) => { e.preventDefault(); setShow((v) => !v); }}
      >
        {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </span>
  );
}
