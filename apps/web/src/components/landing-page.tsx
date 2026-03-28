import Link from "next/link";
import { Footer } from "@/components/footer";

export function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 py-16 md:py-24 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold md:text-5xl">
            麻雀の点数計算を
            <br />
            マスターしよう
          </h1>
          <p className="mt-4 text-base text-primary-100 md:text-lg">
            符計算から点数申告まで、初心者でもステップバイステップで学べるトレーニングアプリ
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/practice"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
            >
              練習をはじめる
            </Link>
            <Link
              href="/reference"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              点数表を見る
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="符計算ドリル"
            description="手牌から符を正しく数える練習ができます"
            href="/practice"
          />
          <FeatureCard
            title="点数申告トレーニング"
            description="翻数と符から素早く点数を答える反復練習"
            href="/practice"
          />
          <FeatureCard
            title="点数早見表"
            description="親・子の点数を一覧でいつでも確認"
            href="/reference"
          />
        </div>
      </section>

      {/* App download banner */}
      <section className="mx-6 mb-12 rounded-xl border border-surface-200 bg-white px-6 py-8 text-center shadow-sm md:mx-auto md:max-w-2xl">
        <p className="text-sm font-semibold text-primary-600">Coming Soon</p>
        <h2 className="mt-1 text-lg font-bold text-surface-900">
          スマートフォンアプリ
        </h2>
        <p className="mt-2 text-sm text-surface-500">
          iOS / Android アプリで通勤中やオフラインでも練習できます
        </p>
      </section>

      <Footer />
    </>
  );
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-surface-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="text-base font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
        {title}
      </h3>
      <p className="mt-2 text-sm text-surface-500">{description}</p>
    </Link>
  );
}
