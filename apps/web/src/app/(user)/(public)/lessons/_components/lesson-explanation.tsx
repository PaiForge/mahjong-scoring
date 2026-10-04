import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { GuideParagraph } from "@/app/(user)/(public)/learn/_components/guide-paragraph";
import { ManganOyaTsumoScoreTable } from "@/app/(user)/(public)/learn/_components/mangan-oya-tsumo-score-table";
import { YakuHanTable } from "@/app/(user)/(public)/learn/_components/yaku-han-table";
import { ManganKoRonGuide } from "@/app/(user)/(public)/learn/mangan-ko-ron/_components/mangan-ko-ron-guide";
import { ManganOyaRonGuide } from "@/app/(user)/(public)/learn/mangan-oya-ron/_components/mangan-oya-ron-guide";
import { ManganKoTsumoGuide } from "@/app/(user)/(public)/learn/mangan-ko-tsumo/_components/mangan-ko-tsumo-guide";
import {
  lessonBySlug,
  type LessonSlug,
} from "@mahjong-scoring/features/lessons/registry";
import { stripTermMarkup } from "@/lib/glossary/term-markup";

/**
 * レッスンの説明の出所
 *
 * - `chapter`: 教本の章の本文をそのまま出す。章が短く、レッスン用に
 *   絞ると章とほぼ同じ文を二重に持つことになるもの。`excerptKeys` は
 *   抜粋（{@link lessonExcerpt}）に使う章の段落の辞書キー（名前空間付き）
 * - `summary`: 章の本文を「導入 → 要点 → 表 → 表の読み方」に絞った
 *   レッスン用の文（辞書の `lead` / `point1` / `point2`）と表
 */
type LessonExplanationSource =
  | {
      readonly kind: "chapter";
      readonly guide: ReactNode;
      readonly excerptKeys: readonly string[];
    }
  | { readonly kind: "summary"; readonly table: ReactNode };

/**
 * レッスンごとの説明
 *
 * 表は教本の章と同じコンポーネントを使う。レッスンで見た表がそのまま章にもあり、
 * 確認問題の選択肢（features の `lessonQuiz`）も表と同じ出所（core）から
 * 導いている。`Record<LessonSlug, …>` なので、レッスンを足したら説明を
 * 決めるまで型検査が通らない。
 */
const LESSON_EXPLANATIONS: Readonly<
  Record<LessonSlug, LessonExplanationSource>
> = {
  "mangan-ko-ron": {
    kind: "chapter",
    guide: <ManganKoRonGuide />,
    // 章の本文（`ManganGuideLayout`）のうち表より前の 2 段落
    excerptKeys: ["manganKoRon.learn.body1", "manganKoRon.learn.body2"],
  },
  "mangan-ko-tsumo": {
    kind: "chapter",
    // 導出の節（ロンを半分にする）まで出す。確認問題のヒントはその節の
    // 手順を指しているため、表の節だけでは拠り所が無くなる
    guide: <ManganKoTsumoGuide />,
    excerptKeys: ["manganKoTsumo.learn.body1", "manganKoTsumo.learn.body2"],
  },
  "mangan-oya-ron": {
    kind: "chapter",
    // 章は表の節 1 つだけ。確認問題のヒントは「子の点数の 1.5 倍」を指し、
    // その拠り所（子の 1.5 倍・倍率は子と同じ）は本文の冒頭と表の後にある
    guide: <ManganOyaRonGuide />,
    excerptKeys: ["manganOyaRon.learn.body1", "manganOyaRon.learn.body2"],
  },
  "mangan-oya-tsumo": { kind: "summary", table: <ManganOyaTsumoScoreTable /> },
  yaku: { kind: "summary", table: <YakuHanTable /> },
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
 * Server Component。見出しごと描く — 章の本文を出すときは章の見出しを
 * そのまま使い、「まず覚えること」と章の見出しの 2 本を重ねない。
 */
export async function LessonExplanation({
  slug,
  messageKey,
}: LessonExplanationProps) {
  const source = LESSON_EXPLANATIONS[slug];
  if (source.kind === "chapter") return source.guide;

  const [t, tLesson] = await Promise.all([
    getTranslations("lessons"),
    getTranslations(`lessons.${messageKey}`),
  ]);

  return (
    <section className="space-y-3">
      <SectionTitle>{t("learnTitle")}</SectionTitle>
      <GuideParagraph>{tLesson("lead")}</GuideParagraph>
      <GuideParagraph>{tLesson("point1")}</GuideParagraph>
      {source.table}
      <GuideParagraph>{tLesson("point2")}</GuideParagraph>
    </section>
  );
}

/** 要約の説明の段落（`lessons.<messageKey>` の中のキー） */
const SUMMARY_PARAGRAPH_KEYS = ["lead", "point1", "point2"] as const;

/**
 * レッスンの説明の冒頭の文（表と見出しを除いた段落）
 * レッスン抜粋
 *
 * 前のレッスンの完了画面が「次のレッスン」として冒頭を見せるのに使う。
 * 説明と同じ辞書から引くので、説明を直せば抜粋も揃う。用語マークアップは
 * 外す（抜粋はリンクを置かずに文だけを見せる）。
 */
export async function lessonExcerpt(
  slug: LessonSlug,
): Promise<readonly string[]> {
  const source = LESSON_EXPLANATIONS[slug];
  if (source.kind === "chapter") {
    const t = await getTranslations();
    return source.excerptKeys.map((key) => stripTermMarkup(t(key)));
  }
  const messageKey = lessonBySlug(slug)?.messageKey;
  if (messageKey === undefined) return [];
  const t = await getTranslations(`lessons.${messageKey}`);
  return SUMMARY_PARAGRAPH_KEYS.map((key) => stripTermMarkup(t(key)));
}
