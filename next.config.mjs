/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // destination: "http://3.25.236.201:8088/api/:path*", // 代理到后端 API
        destination: "http://3.107.208.72:8088/api/:path*", // 代理到后端 API
      },
    ];
  },
};

export default nextConfig;
