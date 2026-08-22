import { useTranslations } from "next-intl";

import { LinkButton } from "@/app/_components/link-button";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="border-b-4 border-ink bg-gradient-to-br from-primary-500 to-primary-700 px-6 py-16 md:py-24 text-white">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        {/* 見出しは深緑のオフセット影で持ち上げる（vibe-traps の .hero h1 に相当）。
            色は --text-shadow-pop 側で持つ（下地が緑のため ink ではなく primary-800）。 */}
        <h1 className="text-3xl font-bold md:text-5xl whitespace-pre-line text-shadow-pop">
          {t("heroTitle")}
        </h1>
        <p className="text-base text-primary-100 md:text-lg">
          {t("heroDescription")}
        </p>
        <div className="flex justify-center">
          <LinkButton href="/getting-started" variant="secondary" size="xl">
            {t("ctaGetStarted")}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
