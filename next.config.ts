import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // IPアドレス経由でのアクセスを許可（開発環境）
  allowedDevOrigins: ['192.168.0.6'],
};

export default nextConfig;
