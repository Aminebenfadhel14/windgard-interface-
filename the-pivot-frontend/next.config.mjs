/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
  serverExternalPackages: ['pdf-parse', '@react-pdf/renderer'],
}

export default nextConfig
