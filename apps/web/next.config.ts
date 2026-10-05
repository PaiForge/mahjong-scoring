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
 * パスも avatars バケットの `<userId>/avatar.webp`（/api/profile/avatar が
 * WebP に正規化して書く唯一のオブジェクト）に絞る。バケット内のそれ以外の
 * オブジェクト（書き込みをサーバに限定する前に直接置かれ得たもの）を
 * 画像最適化のデコーダに渡さないため。ネイティブ広告の画像
 * （ad-creatives バケット）も同じく、/api/admin/ads/image が WebP に
 * 正規化して書く `<uuid>.webp` だけを通す。
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
    const pattern = (pathname: string): RemotePattern => ({
      protocol: protocol === "http:" ? "http" : "https",
      hostname,
      ...(port ? { port } : {}),
      pathname,
    });
    return [
      pattern("/storage/v1/object/public/avatars/*/avatar.webp"),
      pattern("/storage/v1/object/public/ad-creatives/*.webp"),
    ];
  } catch {
    return [];
  }
}

/**
 * 配信中のビルドを識別する ID
 * ビルドID
 *
 * Vercel のデプロイ ID（無ければコミット SHA）をクライアントとサーバーの両方の
 * バンドルに焼き込む。開いたままのタブが `/api/version` の値と自分の値を比べ、
 * 違っていればデプロイ後の新版へ乗り換える（`app/_components/app-version-watcher.tsx`）。
 *
 * Next の `buildId` を使わないのは、クライアントから読む公式の手段が無いため。
 * ローカルのビルドでは undefined になり、監視は何もしない（デプロイが無い環境で
 * 偽の不一致を作らないため）。手元で試すときは
 * `VERCEL_GIT_COMMIT_SHA=<任意の値> pnpm build` のように与える。
 */
const appBuildId =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: appBuildId === undefined ? {} : { NEXT_PUBLIC_BUILD_ID: appBuildId },
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
    "@mahjong-scoring/features",
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
  async redirects() {
    return [
      // 段級位一覧（/dojo/ranks）は道場（/dojo）の「黒帯への道」に吸収した
      // （2026-10）。sitemap に載っていた URL なので恒久リダイレクトで受ける。
      // 級の詳細（/dojo/ranks/<slug>）はそのまま
      {
        source: "/dojo/ranks",
        destination: "/dojo",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
