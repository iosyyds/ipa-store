/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  webpack: (config, { dev }) => {
    // 禁用 Next 内置 cssnano-simple：其颜色压缩会把白色 rgba 错误转成 #ff0。
    // Next 的 minimizer 是函数数组，CSS 那个函数体内含 css-minimizer-plugin 引用。
    // 仅移除 CSS 压缩函数，保留 JS 压缩。
    if (!dev && Array.isArray(config.optimization.minimizer)) {
      config.optimization.minimizer = config.optimization.minimizer.filter(
        (m) =>
          !(
            typeof m === 'function' &&
            /css-minimizer-plugin|CssMinimizerPlugin/.test(m.toString())
          )
      );
    }
    return config;
  },
};

export default nextConfig;
