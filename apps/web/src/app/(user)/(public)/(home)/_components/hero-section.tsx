import Link from "next/link";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="border-b-4 border-ink bg-gradient-to-br from-primary-500 to-primary-700 px-6 py-16 md:py-24 text-white">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        {/* 見出しは深緑のオフセット影で持ち上げる（vibe-traps の .hero h1 に相当）。
            下地が緑のためここだけ ink ではなく、より暗い primary-800 を影に使う。 */}
        <h1 className="text-3xl font-bold md:text-5xl whitespace-pre-line [text-shadow:4px_4px_0_var(--color-primary-800)]">
          {t("heroTitle")}
        </h1>
        <p className="text-base text-primary-100 md:text-lg">
          {t("heroDescription")}
        </p>
        <div className="flex justify-center">
          <Link
            href="/getting-started"
            className="press-md rounded-lg border-4 border-ink bg-white px-8 py-3 text-base font-bold text-primary-700 shadow-md hover:bg-primary-50"
          >
            {t("ctaGetStarted")}
          </Link>
        </div>
      </div>
    </section>
  );
}
