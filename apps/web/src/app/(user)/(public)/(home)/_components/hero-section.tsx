import { useTranslations } from "next-intl";

import { LinkButton } from "@/app/(user)/_components/link-button";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section className="bg-gradient-to-br from-primary-500 to-primary-700 px-6 py-16 md:py-24 text-white">
      <div className="mx-auto max-w-3xl space-y-8 text-center">
        <h1 className="text-3xl font-bold md:text-5xl whitespace-pre-line">
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
