import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { GuideParagraph } from "@/app/(user)/(public)/learn/_components/guide-paragraph";
import { ManganKoTsumoScoreTable } from "@/app/(user)/(public)/learn/_components/mangan-ko-tsumo-score-table";
import { ManganOyaTsumoScoreTable } from "@/app/(user)/(public)/learn/_components/mangan-oya-tsumo-score-table";
import { ManganScoreTable } from "@/app/(user)/(public)/learn/_components/mangan-score-table";
import { YakuHanTable } from "@/app/(user)/(public)/learn/_components/yaku-han-table";
import type { LessonSlug } from "@mahjong-scoring/features/lessons/registry";

/**
 * レッスンごとに説明へ添える表
 *
 * 教本の章と同じコンポーネントを使う。レッスンで見た表がそのまま章にもあり、
 * 確認問題の選択肢（features の `lessonQuiz`）も表と同じ出所（core）から
 * 導いている。`Record<LessonSlug, …>` なので、レッスンを足したら表を
 * 決めるまで型検査が通らない。
 */
const LESSON_TABLES: Readonly<Record<LessonSlug, ReactNode>> = {
  "mangan-ko-ron": <ManganScoreTable role="ko" />,
  "mangan-ko-tsumo": <ManganKoTsumoScoreTable />,
  "mangan-oya-ron": <ManganScoreTable role="oya" />,
  "mangan-oya-tsumo": <ManganOyaTsumoScoreTable />,
  yaku: <YakuHanTable />,
};

interface LessonExplanationProps {
  readonly slug: LessonSlug;
  /** レッスンの辞書の名前空間（`lessons.<messageKey>`） */
  readonly messageKey: string;
}

/**
 * レッスンの説明（確認問題の前に読む部分）
 * レッスン説明
 *
 * Server Component。教本の章の本文を「導入 → 要点 → 表 → 表の読み方」に
 * 絞ったもの。どのレッスンも同じ形で、文言は辞書（`lead` / `point1` /
 * `point2`）、表はレッスンごとに {@link LESSON_TABLES} から引く。形を
 * 揃えるのは、黒帯への道の学ぶ段をどの章でも同じ体験にするため。
 */
export async function LessonExplanation({
  slug,
  messageKey,
}: LessonExplanationProps) {
  const t = await getTranslations(`lessons.${messageKey}`);

  return (
    <div className="space-y-3">
      <GuideParagraph>{t("lead")}</GuideParagraph>
      <GuideParagraph>{t("point1")}</GuideParagraph>
      {LESSON_TABLES[slug]}
      <GuideParagraph>{t("point2")}</GuideParagraph>
    </div>
  );
}
