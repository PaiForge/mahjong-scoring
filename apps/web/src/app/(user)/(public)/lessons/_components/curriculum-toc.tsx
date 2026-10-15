import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { ROW_LINK_TITLE_CLASSES } from "@/app/_components/_lib/link-classes";
import { chapterHref } from "@mahjong-scoring/features/routes";
import {
  getChapterI18nPath,
  isColumnChapter,
  type CurriculumChapter,
  type CurriculumSection,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  BULLET_CENTER_TOP_PX,
  CHAPTER_ROW_BASE_CLASS,
  CHAPTER_ROW_BOX_CLASS,
  GUIDE_LINE_LEFT_PX,
  SECTION_BULLET_SIZE_CLASS,
} from "../_lib/toc-layout";
import { chapterTocAnchorId } from "../_lib/toc-anchor";

interface CurriculumTocProps {
  readonly section: CurriculumSection;
  readonly chapters: readonly CurriculumChapter[];
  /** 完了したレッスン（章）。完了の印を出さない場面では空集合を渡す */
  readonly completedSlugs: ReadonlySet<string>;
  readonly nextSlug: string | undefined;
  /**
   * 章の行に id（{@link chapterTocAnchorId}）を付けるか。`/lessons` の目次
   * だけが付ける — 抜粋の側が付けると、同じ章が 2 度並ぶページで重複する
   */
  readonly anchored?: boolean;
  /**
   * セクション名の見出しレベル。目次のすぐ上にある見出しの 1 段下を渡す —
   * `/lessons` は h1 の直下なので 2、抜粋（`ChapterTocList`・ダッシュボード）は
   * `SectionTitle` 等の h2 の下に置かれるので 3
   */
  readonly headingLevel: 2 | 3;
}

/**
 * Zenn 書籍目次風の章リスト（セクション階層版）
 *
 * bullet 1 つが「セクション（カテゴリ）」を表し、章はその右下にインデントして
 * ぶら下がる構造。破線ガイド線はセクション bullet の中心から最後の章までを
 * 縦に束ねる。
 *
 * - セクション bullet は `size-4`（カテゴリ色）＋右側にセクション名の見出し
 *   （`headingLevel`）。`<section>` にも `<ol>` にもラベルを付けない —
 *   名前を持つ `<section>` はランドマーク（region）になり、目次のセクションの
 *   数だけランドマークが並ぶ。見出しがあれば見出しの移動で辿れる
 * - 章は bullet なし / `pl-7` インデントで配置し「タイトル Link + description」を表示
 * - 「次はここから」バッジは行の右端、`aria-current="step"` も付与
 * - 完了したレッスンは行の右端に緑丸のチェック（白抜き・枠なし）
 *
 * - コラム（`ChapterKind`）は一段弱く描く: 小さな「コラム」の札と小さな
 *   タイトルだけで、説明文・完了の印・「次はここから」を持たない。順路の
 *   レッスンの間に差し込んだ寄り道だと、行の重さで分かるようにする
 *
 * 行全体が押せる面になる。タイトルの `Link` の `::after` を行（`li`）いっぱいに
 * 被せる（{@link STRETCHED_LINK_CLASSES}）— `<a>` で行ごと包むとリンク名が
 * 「タイトル＋説明文＋札」の長い文になるため、リンク名はタイトルだけに保つ。
 * 行の間に区切り線が無いので、hover / 押している間に行を淡く塗って押せる
 * 範囲を見せる。
 *
 * バッジとチェックは同じ右端の位置に出す（完了したレッスンが「次」になることは
 * ないため排他）。行の中で状態を示す印は右端の 1 列に揃え、左側はタイトルと
 * 説明文だけが縦に並ぶようにする。
 *
 * @remarks
 * サーバーコンポーネント。Props だけから描画が決まるため Server Action による
 * 完了の記録後も親の再レンダリングでそのまま反映される。
 */
export async function CurriculumToc({
  section,
  chapters,
  completedSlugs,
  nextSlug,
  anchored = false,
  headingLevel,
}: CurriculumTocProps) {
  const t = await getTranslations("learnCurriculum");
  const tIndex = await getTranslations("learnCurriculum.index");
  const tChapter = await getTranslations("learnCurriculum.chapter");

  if (chapters.length === 0) return undefined;

  const bulletColorClass = SECTION_CATEGORY_COLOR_CLASS[section];
  const sectionLabel = t(`sections.${section}`);
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
            className={`relative z-10 inline-block ${SECTION_BULLET_SIZE_CLASS} shrink-0 rounded-full border-2 border-panel ${bulletColorClass}`}
          />
          <Heading className="text-sm font-bold tracking-wide text-surface-900">
            {sectionLabel}
          </Heading>
        </div>
        <ol className="flex flex-col" data-testid="curriculum-chapter-list">
          {chapters.map((ch) => {
            if (isColumnChapter(ch)) {
              return (
                <li
                  key={ch.slug}
                  id={anchored ? chapterTocAnchorId(ch.slug) : undefined}
                  className={`${CHAPTER_ROW_BASE_CLASS} ${ROW_SURFACE_CLASSES} scroll-mt-24`}
                  data-chapter-slug={ch.slug}
                  data-column="true"
                >
                  <span className="inline-flex h-5 shrink-0 items-center rounded-md bg-surface-100 px-1.5 text-[10px] leading-none font-bold text-surface-500">
                    {tIndex("columnBadge")}
                  </span>
                  <Link
                    href={chapterHref(ch.slug)}
                    // 札（h-5）と同じ行の高さにして、1 行目の中心を揃える
                    className={`min-w-0 text-xs leading-5 ${ROW_LINK_TITLE_CLASSES} ${STRETCHED_LINK_CLASSES}`}
                  >
                    {t(`${getChapterI18nPath(ch)}.title`)}
                  </Link>
                </li>
              );
            }

            const isDone = completedSlugs.has(ch.slug);
            const isNext = nextSlug === ch.slug;
            const path = getChapterI18nPath(ch);

            // タイトルと説明文を左の列に縦に積み、印（次の札・完了）を右の列に
            // 2 行またいで置く。包む要素を挟まず <li> の直下に並べるためのグリッド。
            // 印が無い行は右の列を作らない（列の間の gap だけが残って本文が狭まる）。
            // scroll-mt は目次へのアンカー着地でヘッダの下に隠れないための逃がし
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
                key={ch.slug}
                id={anchored ? chapterTocAnchorId(ch.slug) : undefined}
                className={rowClass}
                data-chapter-slug={ch.slug}
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
                <Link
                  href={chapterHref(ch.slug)}
                  className={`col-start-1 row-start-1 text-sm font-bold ${ROW_LINK_TITLE_CLASSES} ${STRETCHED_LINK_CLASSES}`}
                >
                  {t(`${path}.title`)}
                </Link>
                {/* リンク色 (muted-foreground = surface-500) と並ぶため、
                    説明文は同系のまま一段淡くして主従を付ける。 */}
                <p className="col-start-1 row-start-2 text-xs text-surface-400">
                  {t(`${path}.description`)}
                </p>
                {isNext && (
                  <span
                    data-testid="curriculum-next-badge"
                    className="col-start-2 row-span-2 row-start-1 mt-0.5 inline-flex h-6 items-center self-start rounded-md bg-amber-100 px-2 text-[11px] leading-none font-bold text-amber-900"
                  >
                    {tIndex("nextChapterBadge")}
                  </span>
                )}
                {isDone && (
                  <span
                    role="img"
                    aria-label={tChapter("completedMark")}
                    data-testid="curriculum-achieved-mark"
                    className="col-start-2 row-span-2 row-start-1 mt-0.5 inline-flex size-6 items-center justify-center self-start rounded-full bg-success text-success-foreground"
                  >
                    <CheckIcon className="size-3.5" />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
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
 * タイトルの `Link` を行いっぱいの押せる面に広げる。`::after` は位置の基準を
 * 持つ最も近い祖先 = `li`（`CHAPTER_ROW_BOX_CLASS` の `relative`）に広がる。
 * 札や完了の印は位置を持たないので、この面の下に描かれ押下を奪わない。
 * キーボードのフォーカスリングもタイトルの周りではなく行の外周に出す
 */
const STRETCHED_LINK_CLASSES =
  "after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset";

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
