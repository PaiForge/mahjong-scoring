import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

export function Dashboard() {
  const t = useTranslations("dashboard");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-3 text-sm text-surface-500">{t("description")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-surface-400">{t("todayPractice")}</p>
          <p className="mt-1 text-2xl font-bold text-surface-700">{t("todayPracticeUnit", { count: 0 })}</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-surface-400">{t("accuracy")}</p>
          <p className="mt-1 text-2xl font-bold text-surface-700">{t("accuracyValue")}</p>
        </div>
        <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-surface-400">{t("streak")}</p>
          <p className="mt-1 text-2xl font-bold text-surface-700">{t("streakUnit", { count: 0 })}</p>
        </div>
      </div>
    </ContentContainer>
  );
}
