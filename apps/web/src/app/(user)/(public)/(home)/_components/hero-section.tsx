import Link from "next/link";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 py-16 md:py-24 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold md:text-5xl whitespace-pre-line">
          {t("heroTitle")}
        </h1>
        <p className="mt-4 text-base text-primary-100 md:text-lg">
          {t("heroDescription")}
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/practice"
            className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
          >
            {t("ctaGetStarted")}
          </Link>
        </div>
      </div>
    </section>
  );
}
