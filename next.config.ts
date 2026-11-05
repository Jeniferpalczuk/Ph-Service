import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF.js and its native canvas bindings must run in Node, outside Turbopack.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
