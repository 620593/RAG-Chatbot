import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  // Proxy API routes to the FastAPI backend in local dev (mirrors vercel.json rewrites)
  // In production on Vercel, these are handled by vercel.json rewrites instead.
  async rewrites() {
    return [
      { source: "/upload",      destination: `${BACKEND_URL}/upload` },
      { source: "/chat",        destination: `${BACKEND_URL}/chat` },
      { source: "/health",      destination: `${BACKEND_URL}/health` },
      { source: "/status",      destination: `${BACKEND_URL}/status` },
      { source: "/docs",        destination: `${BACKEND_URL}/docs` },
      { source: "/redoc",       destination: `${BACKEND_URL}/redoc` },
      { source: "/api/:path*",  destination: `${BACKEND_URL}/:path*` },
    ];
  },
};

export default nextConfig;
