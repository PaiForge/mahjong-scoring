import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@mahjong-scoring/core",
    "@pai-forge/riichi-mahjong",
    "@pai-forge/mahjong-react-ui",
  ],
  turbopack: {
    resolveAlias: {
      "react-native": "./src/shims/react-native.ts",
    },
  },
};

export default withNextIntl(nextConfig);
