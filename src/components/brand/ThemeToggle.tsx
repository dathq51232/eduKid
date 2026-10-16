'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const KEY = 'educhain-theme';

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Nút đổi chế độ sáng / tối. Lựa chọn được nhớ trên trình duyệt; chưa chọn thì theo hệ điều hành. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
    // Chưa tự chọn: đi theo hệ điều hành khi hệ điều hành đổi chế độ
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(KEY); } catch { /* bỏ qua */ }
      if (saved === 'light' || saved === 'dark') return;
      const t: Theme = mq.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', t);
      setTheme(t);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(KEY, next); } catch { /* bỏ qua */ }
    setTheme(next);
  };

  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggle}
      aria-label={dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={dark ? 'Chế độ sáng' : 'Chế độ tối'}
    >
      {dark ? <Sun aria-hidden="true" strokeWidth={2.3} /> : <Moon aria-hidden="true" strokeWidth={2.3} />}
    </button>
  );
}
