'use client';

import { useEffect, useState } from 'react';

type Props = {
  onConfirm: () => void;
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  disabled?: boolean;
};

// Nút cần bấm hai lần cho thao tác khó hoàn tác (không dùng hộp thoại của trình duyệt).
export default function ConfirmButton({ onConfirm, children, confirmLabel = 'Bấm lần nữa để xác nhận', className = 'adm-btn', disabled }: Props) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      className={`${className}${armed ? ' is-armed' : ''}`}
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
