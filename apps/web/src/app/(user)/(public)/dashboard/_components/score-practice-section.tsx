import { getTranslations } from "next-intl/server";

import { ScorePracticeBanner } from "@/app/(user)/(public)/practice/_components/practical-practice-banners";
import { SectionTitle } from "@/app/(user)/_components/section-title";

/**
 * ダッシュボードのフォールバックセクション。
 * 和了形の点数計算のすすめ
 *
 * 全級を取得したユーザーには黒帯への道の「次にやること」が無い。ダッシュボードが
 * お知らせだけになるのを避けるため、終わりのない和了形の点数計算へ誘導する（教本に
 * 未学習の章が残っていれば「教本の続き」と並ぶ）。
 */
export async function ScorePracticeSection() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-4">
      <SectionTitle>{t("recommendedPracticeTitle")}</SectionTitle>

      <p className="text-sm text-surface-500">{t("scorePracticeHint")}</p>

      <ScorePracticeBanner />
    </div>
  );
}
