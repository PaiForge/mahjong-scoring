import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckIcon } from "@/app/_components/icons/check-icon";
import {
  getChapterI18nPath,
  type CurriculumChapter,
  type CurriculumSection,
} from "../_lib/curriculum";

interface CurriculumTocProps {
  readonly section: CurriculumSection;
  readonly chapters: readonly CurriculumChapter[];
  readonly readSlugs: ReadonlySet<string>;
  readonly nextSlug: string | undefined;
}

/**
 * Zenn 書籍目次風の章リスト（セクション階層版）
 *
 * bullet 1 つが「セクション（カテゴリ）」を表し、章はその右下にインデントして
 * ぶら下がる構造。破線ガイド線はセクション bullet の中心から最後の章までを
 * 縦に束ねる。
 *
 * - セクション bullet は `size-4`（カテゴリ色）＋右側にラベル（`<p>`、見出し要素は使わない）
 * - 章は bullet なし / `pl-7` インデントで配置し「タイトル Link + description」を表示
 * - 「次はここから」バッジは章タイトル横にインライン、`aria-current="step"` も付与
 * - 読了済み章は行の右端に CheckIcon
 *
 * @remarks
 * サーバーコンポーネント。Props だけから描画が決まるため Server Action による
 * 読了状態更新後も親の再レンダリングでそのまま反映される。
 */
export async function CurriculumToc({
  section,
  chapters,
  readSlugs,
  nextSlug,
}: CurriculumTocProps) {
  const t = await getTranslations("learnCurriculum");
  const tIndex = await getTranslations("learnCurriculum.index");
  const tChapter = await getTranslations("learnCurriculum.chapter");

  if (chapters.length === 0) return undefined;

  const bulletColorClass = SECTION_CATEGORY_COLOR_CLASS[section];
  const sectionLabel = t(`sections.${section}`);

  // Horizontal offset from the left edge of the outer <div> to the vertical
  // center of the section bullet: half of size-4 (8px).
  // NOTE: keep in sync with SECTION_BULLET_SIZE_CLASS ("size-4") below.
  const BULLET_CENTER_LEFT_PX = 8;
  // Vertical offset from the top of the outer <div> to the vertical center of
  // the section bullet: half of size-4 (8px). Because the bullet sits on the
  // first line of the heading row with no extra top padding, this is simply
  // half of the bullet height.
  const BULLET_CENTER_TOP_PX = 8;

  return (
    <section aria-label={sectionLabel}>
      <div className="relative">
        <span
          aria-hidden="true"
          data-testid="curriculum-dashed-line"
          className="pointer-events-none absolute border-l border-dashed border-surface-300"
          style={{
            left: `${BULLET_CENTER_LEFT_PX}px`,
            top: `${BULLET_CENTER_TOP_PX}px`,
            bottom: `${BULLET_CENTER_TOP_PX}px`,
          }}
        />
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            data-testid="curriculum-section-bullet"
            data-section={section}
            className={`relative z-10 inline-block ${SECTION_BULLET_SIZE_CLASS} shrink-0 rounded-full ${bulletColorClass}`}
          />
          <p className="text-sm font-semibold tracking-wide text-surface-900">
            {sectionLabel}
          </p>
        </div>
        <ol
          className="flex flex-col"
          data-testid="curriculum-chapter-list"
          aria-label={sectionLabel}
        >
          {chapters.map((ch) => {
            const isRead = readSlugs.has(ch.slug);
            const isNext = nextSlug === ch.slug;
            const path = getChapterI18nPath(ch);

            const rowClass = `${CHAPTER_ROW_BASE_CLASS} ${
              isNext ? "bg-amber-50" : ""
            }`;

            return (
              <li
                key={ch.slug}
                className={rowClass}
                data-chapter-slug={ch.slug}
                aria-current={isNext ? "step" : undefined}
                data-next={isNext ? "true" : undefined}
                data-read={isRead ? "true" : undefined}
              >
                {isNext && (
                  <span
                    aria-hidden="true"
                    data-testid="curriculum-next-line"
                    className="pointer-events-none absolute top-0 bottom-0 z-10 w-[2px] bg-amber-400"
                    style={{ left: `${BULLET_CENTER_LEFT_PX - 1}px` }}
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/learn/${ch.slug}`}
                      className="text-sm font-semibold text-surface-900 transition-colors hover:text-primary-700 hover:underline"
                    >
                      {t(`${path}.title`)}
                    </Link>
                    {isNext && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                        {tIndex("nextChapterBadge")}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-surface-500">
                    {t(`${path}.description`)}
                  </span>
                </span>
                {isRead && (
                  <CheckIcon
                    className="mt-1 size-4 shrink-0 text-primary-600"
                    data-testid="curriculum-achieved-mark"
                    aria-label={tChapter("markedAsRead")}
                  />
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
 * セクション（カテゴリ）ごとの配色
 *
 * 既存のプライマリ（緑）と surface 系トーンに違和感のない Tailwind 標準カラーを
 * 採用。全体的に落ち着いた色味に揃え、視認性を担保する。bullet 以外にも
 * カテゴリを示す要素が増えた際はここを参照する。
 */
const SECTION_CATEGORY_COLOR_CLASS: Readonly<
  Record<CurriculumSection, string>
> = {
  foundation: "bg-surface-400",
  fu: "bg-primary-500",
  yaku: "bg-amber-500",
  score: "bg-sky-500",
};

/**
 * セクション bullet のサイズ。
 * BULLET_CENTER_LEFT_PX / BULLET_CENTER_TOP_PX（破線ガイド線の座標）と
 * 対応しているため変更時はそちらも更新すること。
 */
const SECTION_BULLET_SIZE_CLASS = "size-4";

/**
 * 章行の共通クラス。
 * セクション bullet 中心 (left=8px) より右側に章タイトルが配置されるよう
 * `pl-7` (28px) でインデント。「次はここから」の amber 実線は破線ガイド線と
 * 同じ x 座標に absolute 配置するため、border-l は使わない。
 * 変更時は破線ガイド線の座標と視覚的にズレないか確認すること。
 */
const CHAPTER_ROW_BASE_CLASS = "relative flex items-start gap-3 py-3 pl-7 pr-2";
