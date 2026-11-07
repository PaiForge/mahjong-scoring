"use client";

import { useTranslations } from "next-intl";

import { CheckIcon } from "@/app/[locale]/(user)/_components/icons/check-icon";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import { ROW_LINK_TITLE_CLASSES } from "@/app/_components/_lib/link-classes";
import type {
  ChapterKind,
  CurriculumChapterSlug,
  CurriculumSection,
} from "@mahjong-scoring/features/curriculum/registry";

import { chapterTocAnchorId } from "../_lib/toc-anchor";
import {
  CHAPTER_ROW_BASE_CLASS,
  CHAPTER_ROW_BOX_CLASS,
  GUIDE_LINE_LEFT_PX,
} from "../_lib/toc-layout";
import { useLessonProgress } from "./lesson-progress-provider";

/**
 * 目次の 1 行を描くのに要る値（サーバーで解決済み）
 * 章行データ
 *
 * 張る先（`navTarget`）と文言はサーバーで決めて渡す。公開状態の判定
 * （`resolveNavTargetFor` → `route-policy.ts`）はサイトのルートのレジストリを
 * 読むため、クライアントの部品から import しない（`client-bundle-boundaries.test.ts`）。
 */
export interface ChapterRowData {
  readonly slug: CurriculumChapterSlug;
  readonly kind: ChapterKind;
  readonly section: CurriculumSection;
  /** 「次はここから」の順序（カリキュラムの order） */
  readonly order: number;
  /**
   * 章のページへの張る先。その言語で章を出していなければ日本語の href のまま
   * `crossLocale: true`（英語の存在しない URL を作らない）
   */
  readonly navTarget: NavTarget;
  readonly title: string;
  /** 説明文。コラムは持たない */
  readonly description: string | undefined;
}

interface ChapterRowProps {
  readonly row: ChapterRowData;
  /** 完了の印を出すか（{@link useLessonProgress} が値を持てばそちらが勝つ） */
  readonly isDone: boolean;
  /** 「次はここから」か（{@link useLessonProgress} が値を持てばそちらが勝つ） */
  readonly isNext: boolean;
  /**
   * 行に id（{@link chapterTocAnchorId}）を付けるか。`/lessons` の目次
   * だけが付ける — 抜粋の側が付けると、同じ章が 2 度並ぶページで重複する
   */
  readonly anchored: boolean;
}

/**
 * 目次の章 1 行
 * 章行
 *
 * 完了の印と「次はここから」は、`/lessons` の {@link LessonProgressScope} が
 * 本人の完了を取り終えていればそれを、無ければ props（静的 HTML・サーバーが
 * 完了を読んで渡す抜粋）を使う。目次の行だけをクライアント部品にしたのは、
 * 目次の他の呼び出し元（LP・道場・試験ページ・ダッシュボード）の静的性と
 * 構造に触れずに、`/lessons` だけを静的化して完了を後から付けるため。
 *
 * - レッスンの行はタイトルと説明文を左の列に縦に積み、印（次の札・完了）を
 *   右の列に 2 行またいで置く。印が無い行は右の列を作らない（列の間の gap
 *   だけが残って本文が狭まる）。バッジとチェックは同じ右端の位置に出す
 *   （完了したレッスンが「次」になることはないため排他）
 * - コラム（`ChapterKind`）は一段弱く描く: 小さな「コラム」の札と小さな
 *   タイトルだけで、説明文・完了の印・「次はここから」を持たない
 * - その言語で章を出していない行（`navTarget.crossLocale`）は素の
 *   `<a hrefLang="ja">`（`LocaleNavLink`）で文書ごと日本語へ移し、タイトルに
 *   「日本語のみ」（`nav.language.japaneseOnly`）を添える
 *
 * 行全体が押せる面になる。タイトルのリンクの `::after` を行（`li`）いっぱいに
 * 被せる（{@link STRETCHED_LINK_CLASSES}）— `<a>` で行ごと包むとリンク名が
 * 「タイトル＋説明文＋札」の長い文になるため、リンク名はタイトルだけに保つ。
 */
export function ChapterRow({
  row,
  isDone: isDoneProp,
  isNext: isNextProp,
  anchored,
}: ChapterRowProps) {
  const t = useTranslations("learnCurriculum");
  const tLanguage = useTranslations("nav.language");
  const progress = useLessonProgress();
  const id = anchored ? chapterTocAnchorId(row.slug) : undefined;
  const japaneseOnly = row.navTarget.crossLocale ? (
    <JapaneseOnlyMark label={tLanguage("japaneseOnly")} />
  ) : undefined;

  if (row.kind === "column") {
    return (
      <li
        id={id}
        className={`${CHAPTER_ROW_BASE_CLASS} ${ROW_SURFACE_CLASSES} scroll-mt-24`}
        data-chapter-slug={row.slug}
        data-column="true"
      >
        <span className="inline-flex h-5 shrink-0 items-center rounded-md bg-surface-100 px-1.5 text-[10px] leading-none font-bold text-surface-500">
          {t("index.columnBadge")}
        </span>
        <LocaleNavLink
          navTarget={row.navTarget}
          linkKind="plain"
          // 札（h-5）と同じ行の高さにして、1 行目の中心を揃える
          className={`min-w-0 text-xs leading-5 ${ROW_LINK_TITLE_CLASSES} ${STRETCHED_LINK_CLASSES}`}
        >
          {row.title}
          {japaneseOnly}
        </LocaleNavLink>
      </li>
    );
  }

  const isDone = progress ? progress.completed.has(row.slug) : isDoneProp;
  const isNext = progress ? progress.nextSlug === row.slug : isNextProp;

  // scroll-mt は目次へのアンカー着地でヘッダの下に隠れないための逃がし。
  // 「次はここから」の行は地が琥珀なので、hover も同じ色相で一段濃くする
  // （札の bg-amber-100 と同じ濃さにすると札が地に溶ける）
  const rowClass = `${CHAPTER_ROW_BOX_CLASS} grid gap-x-3 gap-y-2 scroll-mt-24 ${
    isNext || isDone
      ? "grid-cols-[minmax(0,1fr)_auto]"
      : "grid-cols-[minmax(0,1fr)]"
  } ${
    isNext
      ? "group bg-amber-50 transition-colors hover:bg-amber-100/50 active:bg-amber-100/80"
      : ROW_SURFACE_CLASSES
  }`;

  return (
    <li
      id={id}
      className={rowClass}
      data-chapter-slug={row.slug}
      aria-current={isNext ? "step" : undefined}
      data-next={isNext ? "true" : undefined}
      data-done={isDone ? "true" : undefined}
    >
      {isNext && (
        <span
          aria-hidden="true"
          data-testid="curriculum-next-line"
          className="pointer-events-none absolute top-0 bottom-0 z-10 w-[2px] bg-amber-500"
          style={{ left: `${GUIDE_LINE_LEFT_PX}px` }}
        />
      )}
      <LocaleNavLink
        navTarget={row.navTarget}
        linkKind="plain"
        className={`col-start-1 row-start-1 text-sm font-bold ${ROW_LINK_TITLE_CLASSES} ${STRETCHED_LINK_CLASSES}`}
      >
        {row.title}
        {japaneseOnly}
      </LocaleNavLink>
      {/* リンク色 (muted-foreground = surface-500) と並ぶため、
          説明文は同系のまま一段淡くして主従を付ける。 */}
      <p className="col-start-1 row-start-2 text-xs text-surface-400">
        {row.description}
      </p>
      {isNext && (
        <span
          data-testid="curriculum-next-badge"
          className="col-start-2 row-span-2 row-start-1 mt-0.5 inline-flex h-6 items-center self-start rounded-md bg-amber-100 px-2 text-[11px] leading-none font-bold text-amber-900"
        >
          {t("index.nextChapterBadge")}
        </span>
      )}
      {isDone && (
        <span
          role="img"
          aria-label={t("chapter.completedMark")}
          data-testid="curriculum-achieved-mark"
          className="col-start-2 row-span-2 row-start-1 mt-0.5 inline-flex size-6 items-center justify-center self-start rounded-full bg-success text-success-foreground"
        >
          <CheckIcon className="size-3.5" />
        </span>
      )}
    </li>
  );
}

/**
 * 行の面。`group` はタイトルの色を行の hover に追随させるため
 * （{@link ROW_LINK_TITLE_CLASSES}）。hover は `LinkRow` と同じ淡さに揃え、
 * 押している間だけ一段濃くする — タッチ端末には hover が無く、押した行が
 * どれかをその場で見せる手掛かりはこれしか無い（`surface-50` は白地では
 * ほぼ見えない）
 */
const ROW_SURFACE_CLASSES =
  "group transition-colors hover:bg-surface-50 active:bg-surface-100";

/**
 * タイトルのリンクを行いっぱいの押せる面に広げる。`::after` は位置の基準を
 * 持つ最も近い祖先 = `li`（`CHAPTER_ROW_BOX_CLASS` の `relative`）に広がる。
 * 札や完了の印は位置を持たないので、この面の下に描かれ押下を奪わない。
 * キーボードのフォーカスリングもタイトルの周りではなく行の外周に出す
 */
const STRETCHED_LINK_CLASSES =
  "after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset";
