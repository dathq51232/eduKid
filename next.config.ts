import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // game Robot lập trình đã gỡ (10/2026): link cũ đưa về trang trò chơi
  async redirects() {
    return [{ source: '/tro-choi/robot-lap-trinh', destination: '/tro-choi', permanent: false }];
  },
};

export default nextConfig;
