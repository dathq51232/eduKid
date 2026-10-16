'use client';

import { createContext, useContext } from 'react';

export type AdminUser = { userId: string; email: string; displayName: string; isAdmin: boolean; isTeacher: boolean };

const Ctx = createContext<AdminUser | null>(null);

export function AdminProvider({ value, children }: { value: AdminUser; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminUser(): AdminUser {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdminUser phải dùng bên trong AdminProvider');
  return v;
}
