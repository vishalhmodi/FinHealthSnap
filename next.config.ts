import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allows the Prisma adapter packages to work in Next.js server components
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-libsql', '@libsql/client'],
  output: 'standalone',
};

export default nextConfig;
