'use client';

import { useEffect } from 'react';

// Đo chiều cao thật của thanh trên cùng (đổi theo cỡ màn hình, chữ, tài khoản…) và ghi vào biến CSS --learn-top-h
// để các thanh dính bên dưới (thanh làm bài, mục lục, thanh làm đề) nằm ngay dưới, không bị che.
// Khi thanh trên cùng không dính (điện thoại, xem globals.css) thì biến = 0.
export default function HeaderOffset() {
  useEffect(() => {
    const head = document.querySelector<HTMLElement>('.learn-top');
    if (!head) return;
    const root = document.documentElement;
    const apply = () => {
      const sticky = getComputedStyle(head).position === 'sticky';
      root.style.setProperty('--learn-top-h', `${sticky ? Math.ceil(head.getBoundingClientRect().height) : 0}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(head);
    window.addEventListener('resize', apply);
    return () => { ro.disconnect(); window.removeEventListener('resize', apply); };
  }, []);
  return null;
}
