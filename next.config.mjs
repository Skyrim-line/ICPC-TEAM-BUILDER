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
  // 开启静态导出支持（Amplify 默认需要支持静态页面）
  output: "export",
};

export default nextConfig;
