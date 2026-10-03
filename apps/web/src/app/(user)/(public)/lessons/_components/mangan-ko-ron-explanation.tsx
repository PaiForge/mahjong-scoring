import { getTranslations } from "next-intl/server";

import { GuideParagraph } from "@/app/(user)/(public)/learn/_components/guide-paragraph";
import { ManganScoreTable } from "@/app/(user)/(public)/learn/_components/mangan-score-table";

/**
 * 「子のロン（満貫以上）」レッスンの説明
 * レッスン説明
 *
 * Server Component。教本の章（`/learn/mangan-ko-ron`）の本文を 2 段落と
 * 点数表に絞ったもの。表は章と同じ `ManganScoreTable` で、レッスンで見た
 * 表がそのまま章にもある。確認問題の選択肢（features の
 * `MANGAN_KO_RON_LESSON_QUIZ`）もこの表と同じ出所から導いている。
 */
export async function ManganKoRonExplanation() {
  const t = await getTranslations("lessons.manganKoRon");

  return (
    <div className="space-y-3">
      <GuideParagraph>{t("lead")}</GuideParagraph>
      <GuideParagraph>{t("point1")}</GuideParagraph>
      <ManganScoreTable role="ko" />
      <GuideParagraph>{t("point2")}</GuideParagraph>
    </div>
  );
}
