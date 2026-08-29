import { getTranslations } from "next-intl/server";

import { ComprehensivePracticeBanner } from "@/app/(user)/(public)/practice/_components/comprehensive-practice-banner";
import { SectionTitle } from "@/app/(user)/_components/section-title";

/**
 * ダッシュボードのフォールバックセクション。
 * 総合演習のすすめ
 *
 * 教本を読み切り、対応する練習にもひととおり挑戦したユーザーには次に読む章も
 * 未挑戦の練習も無い。ダッシュボードがお知らせだけになるのを避けるため、
 * 終わりのない総合演習へ誘導する。
 */
export async function ComprehensivePracticeSection() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-4">
      <SectionTitle>{t("recommendedPracticeTitle")}</SectionTitle>

      <p className="text-sm text-surface-500">
        {t("comprehensivePracticeHint")}
      </p>

      <ComprehensivePracticeBanner />
    </div>
  );
}
