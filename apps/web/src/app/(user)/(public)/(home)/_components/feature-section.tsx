import Link from "next/link";
import { useTranslations } from "next-intl";

export function FeatureSection() {
  const t = useTranslations("landing");

  return (
    <section className="px-6 py-12">
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <FeatureCard
          title={t("featureFuDrill")}
          description={t("featureFuDrillDescription")}
          href="/practice"
        />
        <FeatureCard
          title={t("featureScoreTraining")}
          description={t("featureScoreTrainingDescription")}
          href="/practice"
        />
        <FeatureCard
          title={t("featureScoreTable")}
          description={t("featureScoreTableDescription")}
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
