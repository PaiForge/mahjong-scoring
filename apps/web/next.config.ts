import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

type RemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

/**
 * Supabase Storage（アバター）の画像ホスト
 *
 * `*.supabase.co` のようなワイルドカードにはしない。Supabase の公開ストレージは
 * どのプロジェクトも `/storage/v1/object/public/**` という同じパス構造を持つため、
 * サブドメインをワイルドカードにすると「第三者が作った任意の Supabase
 * プロジェクトの画像を、このサイトの /_next/image 経由で取得・変換・配信する」
 * ことまで許してしまう。画像最適化の CPU・帯域・関数実行時間を他人のコンテンツに
 * 使われ、自ドメインが第三者コンテンツの配信元にもなる。
 *
 * 自プロジェクトのホストは NEXT_PUBLIC_SUPABASE_URL から導く。プロジェクト参照を
 * ここに直書きすると環境ごとに食い違うため。ローカル開発の
 * http://127.0.0.1:54321 も同じ 1 本で賄える。
 *
 * 未設定・不正値なら Supabase のパターンを足さない（アバターが表示されなくなるが、
 * 任意のホストを開けるよりよい）。この変数は getSupabasePublicEnv() が未設定時に
 * 例外を投げる必須変数なので、実際には設定されている前提でよい。
 */
function supabaseImagePatterns(): RemotePattern[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];

  try {
    const { protocol, hostname, port } = new URL(raw);
    return [
      {
        protocol: protocol === "http:" ? "http" : "https",
        hostname,
        ...(port ? { port } : {}),
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // next dev による AGENTS.md / CLAUDE.md の自動生成を無効化する。
  // AI 向けの規約はリポジトリルートの CLAUDE.md を単一の正とするため。
  agentRules: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      ...supabaseImagePatterns(),
    ],
  },
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
