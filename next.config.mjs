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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io', // Allow UploadThing images
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Allow Google profile images
      },
    ],
  },
};

export default nextConfig;
