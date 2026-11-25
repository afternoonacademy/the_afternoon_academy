import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com", pathname: "/s6cu3nwk/image/upload/**" }] },
  async headers() {
    return [{ source: "/auth/confirm", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "no-store" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ] }]
  },
};

export default nextConfig;
