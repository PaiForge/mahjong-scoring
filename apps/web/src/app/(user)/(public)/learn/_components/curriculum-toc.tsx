import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  chapterHref,
  getChapterI18nPath,
  type CurriculumChapter,
  type CurriculumSection,
} from "../_lib/curriculum";
import {
  BULLET_CENTER_TOP_PX,
  CHAPTER_ROW_BASE_CLASS,
  GUIDE_LINE_LEFT_PX,
  SECTION_BULLET_SIZE_CLASS,
} from "../_lib/toc-layout";

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
 * - 読了済み章は行の右端に緑丸のチェック（白抜き）
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

  return (
    <section aria-label={sectionLabel}>
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
            className={`relative z-10 inline-block ${SECTION_BULLET_SIZE_CLASS} shrink-0 rounded-full border-2 border-ink ${bulletColorClass}`}
          />
          <p className="text-sm font-bold tracking-wide text-surface-900">
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
                    className="pointer-events-none absolute top-0 bottom-0 z-10 w-[2px] bg-amber-500"
                    style={{ left: `${GUIDE_LINE_LEFT_PX}px` }}
                  />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      href={chapterHref(ch.slug)}
                      className={`text-sm font-bold ${TEXT_LINK_CLASSES}`}
                    >
                      {t(`${path}.title`)}
                    </Link>
                    {isNext && (
                      <span className="inline-flex shrink-0 items-center rounded-full border-2 border-ink bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        {tIndex("nextChapterBadge")}
                      </span>
                    )}
                  </span>
                  {/* リンク色 (muted-foreground = surface-500) と並ぶため、
                      説明文は同系のまま一段淡くして主従を付ける。 */}
                  <span className="text-xs text-surface-400">
                    {t(`${path}.description`)}
                  </span>
                </span>
                {isRead && (
                  <span
                    role="img"
                    aria-label={tChapter("markedAsRead")}
                    data-testid="curriculum-achieved-mark"
                    className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-primary-500 text-white"
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
  mangan: "bg-rose-500",
  fu: "bg-primary-500",
  yaku: "bg-amber-500",
  score: "bg-sky-500",
};
