import { nextui } from "@nextui-org/theme";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // 匹配 pages 目录的所有相关文件
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // 匹配 components 目录的所有相关文件
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // 匹配 app 目录的所有相关文件
    "./node_modules/@nextui-org/theme/dist/**/*.{js,mjs}", // 修复 nextui 的路径错误
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)", // 自定义背景色
        foreground: "var(--foreground)", // 自定义前景色
      },
    },
  },
  plugins: [nextui()], // 注册 nextui 插件
};

export default config;
