/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000', 
        'urban-engine-rj77wrwq6rj25wrw-3000.app.github.dev',
      ],
    },
  },
};

export default nextConfig;
