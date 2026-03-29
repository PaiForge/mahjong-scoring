import { useTranslations } from "next-intl";

export function AppDownloadBanner() {
  const t = useTranslations("landing");

  return (
    <section className="mx-6 mb-12 rounded-xl border border-surface-200 bg-white px-6 py-8 text-center shadow-sm md:mx-auto md:max-w-2xl">
      <p className="text-sm font-semibold text-primary-600">{t("appBannerLabel")}</p>
      <h2 className="mt-1 text-lg font-bold text-surface-900">
        {t("appBannerTitle")}
      </h2>
      <p className="mt-2 text-sm text-surface-500">
        {t("appBannerDescription")}
      </p>
    </section>
  );
}
