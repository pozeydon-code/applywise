import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    // pdf-parse v2 uses pdfjs-dist which spawns a worker.
    // Opting out of Next.js bundling lets Node.js resolve paths correctly.
    "pdf-parse",
    "pdfjs-dist",
  ],
};

export default nextConfig;
