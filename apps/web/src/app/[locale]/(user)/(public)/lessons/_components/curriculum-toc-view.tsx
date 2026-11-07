"use client";

import { useTranslations } from "next-intl";

import type { CurriculumSection } from "@mahjong-scoring/features/curriculum/registry";

import {
  BULLET_CENTER_TOP_PX,
  GUIDE_LINE_LEFT_PX,
  SECTION_BULLET_SIZE_CLASS,
} from "../_lib/toc-layout";
import { ChapterRow, type ChapterRowData } from "./chapter-row";

interface CurriculumTocViewProps {
  readonly section: CurriculumSection;
  /** このセクションの行（表示順。サーバーで張る先と文言を解決済み） */
  readonly rows: readonly ChapterRowData[];
  /**
   * 完了したレッスン（章）。完了の印を出さない場面・静的 HTML では空配列を渡す。
   * サーバーからクライアントへ渡すため集合ではなく配列
   */
  readonly completedSlugs: readonly string[];
  readonly nextSlug: string | undefined;
  /** 章の行に id を付けるか（`/lessons` の目次だけ） */
  readonly anchored: boolean;
  /**
   * セクション名の見出しレベル。目次のすぐ上にある見出しの 1 段下を渡す —
   * `/lessons` は h1 の直下なので 2、抜粋・級で絞った目次は h2 の下なので 3
   */
  readonly headingLevel: 2 | 3;
}

/**
 * Zenn 書籍目次風の章リスト（セクション 1 つ分）を props だけから描く
 * 目次ビュー
 *
 * bullet 1 つが「セクション（カテゴリ）」を表し、章はその右下にインデントして
 * ぶら下がる構造。破線ガイド線はセクション bullet の中心から最後の章までを
 * 縦に束ねる。行の描き方（印・コラム・言語をまたぐリンク）は {@link ChapterRow}。
 *
 * - セクション bullet は `size-4`（カテゴリ色）＋右側にセクション名の見出し
 *   （`headingLevel`）。`<section>` にも `<ol>` にもラベルを付けない —
 *   名前を持つ `<section>` はランドマーク（region）になり、目次のセクションの
 *   数だけランドマークが並ぶ。見出しがあれば見出しの移動で辿れる
 *
 * クライアント部品なのは、`/lessons`（静的生成）の目次が完了の印と `?rank=` の
 * 絞り込みをクライアントで後から付けるため。サーバーの `CurriculumToc` は
 * 張る先と文言を解決してこれに委ね、`LessonsIndex` は直接これを描く。
 */
export function CurriculumTocView({
  section,
  rows,
  completedSlugs,
  nextSlug,
  anchored,
  headingLevel,
}: CurriculumTocViewProps) {
  const t = useTranslations("learnCurriculum");
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <section>
      <div className="relative">
        <span
          aria-hidden="true"
          data-testid="curriculum-dashed-line"
          className="pointer-events-none absolute border-l-2 border-dashed border-surface-400"
          style={{
            left: `${GUIDE_LINE_LEFT_PX}px`,
            top: `${BULLET_CENTER_TOP_PX}px`,
            bottom: `${BULLET_CENTER_TOP_PX}px`,
          }}
        />
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            data-testid="curriculum-section-bullet"
            data-section={section}
            className={`relative z-10 inline-block ${SECTION_BULLET_SIZE_CLASS} shrink-0 rounded-full border-2 border-panel ${SECTION_CATEGORY_COLOR_CLASS[section]}`}
          />
          <Heading className="text-sm font-bold tracking-wide text-surface-900">
            {t(`sections.${section}`)}
          </Heading>
        </div>
        <ol className="flex flex-col" data-testid="curriculum-chapter-list">
          {rows.map((row) => (
            <ChapterRow
              key={row.slug}
              row={row}
              isDone={completedSlugs.includes(row.slug)}
              isNext={nextSlug === row.slug}
              anchored={anchored}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * セクション（カテゴリ）ごとの配色
 *
 * 既存のプライマリ（緑）と surface 系トーンに違和感のない Tailwind 標準カラーを
 * 採用。全体的に落ち着いた色味に揃え、視認性を担保する。bullet 以外にも
 * カテゴリを示す要素が増えた際はここを参照する。
 */
const SECTION_CATEGORY_COLOR_CLASS: Readonly<
  Record<CurriculumSection, string>
> = {
  introduction: "bg-surface-400",
  mangan: "bg-rose-500",
  fu: "bg-primary-500",
  yaku: "bg-amber-500",
  score: "bg-sky-500",
  memorization: "bg-violet-500",
};
