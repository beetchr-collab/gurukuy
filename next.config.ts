import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
   images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mdbcdn.b-cdn.net",
        pathname: "/img/**",
      },
    ],
  },
}

export default nextConfig