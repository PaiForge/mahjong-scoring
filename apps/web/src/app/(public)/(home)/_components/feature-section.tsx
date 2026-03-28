import Link from "next/link";

export function FeatureSection() {
  return (
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
