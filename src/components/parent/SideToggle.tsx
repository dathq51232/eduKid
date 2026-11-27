'use client';

// Nút THU GỌN / MỞ RỘNG thanh menu bên trái ở Góc phụ huynh (máy tính).
// Thu gọn: chỉ còn icon, nội dung rộng ra. Nhớ lựa chọn trên máy này (localStorage — chỉ là tiện ích, không lưu được thì thôi).
import { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const KEY = 'ph-menu-thu-gon';

export default function SideToggle() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { if (localStorage.getItem(KEY) === '1') setCollapsed(true); } catch { /* không đọc được: giữ mở rộng */ }
  }, []);
  useEffect(() => {
    document.querySelector('.phx')?.classList.toggle('is-collapsed', collapsed);
    try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch { /* bỏ qua */ }
  }, [collapsed]);

  const label = collapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu';
  return (
    <button type="button" className="phx-collapse" onClick={() => setCollapsed((v) => !v)} aria-label={label} title={label} aria-expanded={!collapsed}>
      {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
    </button>
  );
}
