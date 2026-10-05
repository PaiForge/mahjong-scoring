import { SkeletonBar } from "@/app/_components/skeleton-bar";
import {
  BULLET_CENTER_TOP_PX,
  CHAPTER_ROW_BASE_CLASS,
  GUIDE_LINE_LEFT_PX,
  SECTION_BULLET_SIZE_CLASS,
} from "../_lib/toc-layout";

interface CurriculumTocSkeletonProps {
  /** このセクションに属する章数。実際の目次と同じ行数を確保する */
  readonly chapterCount: number;
  /** セクションラベルのプレースホルダ幅（Tailwind の `w-*` クラス） */
  readonly labelWidthClassName: string;
}

/**
 * 目次（セクション 1 つ分）の読み込み中プレースホルダ
 * 目次スケルトン
 *
 * `CurriculumToc` と同じ構造 — 破線ガイド線・セクション bullet・`pl-7` の章行
 * （タイトル行 + 説明行の 2 段）— を描き、テキストだけを矩形に置き換える。
 * 座標とインデントは `_lib/toc-layout.ts` を実物と共有しているためズレない。
 *
 * 章タイトルの幅は行ごとに変えて、実際の目次と同じくランダムな長さに見せる。
 */
export function CurriculumTocSkeleton({
  chapterCount,
  labelWidthClassName,
}: CurriculumTocSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="curriculum-section-skeleton"
      className="relative"
    >
      <span
        className="pointer-events-none absolute border-l-2 border-dashed border-surface-400"
        style={{
          left: `${GUIDE_LINE_LEFT_PX}px`,
          top: `${BULLET_CENTER_TOP_PX}px`,
          bottom: `${BULLET_CENTER_TOP_PX}px`,
        }}
      />
      <div className="flex items-center gap-2">
        <SkeletonBar
          radius="full"
          tone={300}
          className={`relative z-10 ${SECTION_BULLET_SIZE_CLASS} shrink-0`}
        />
        <p className="text-sm font-bold tracking-wide">
          <SkeletonBar
            as="span"
            className={`inline-block ${labelWidthClassName}`}
          >
            &nbsp;
          </SkeletonBar>
        </p>
      </div>
      <div className="flex flex-col">
        {Array.from({ length: chapterCount }).map((_, i) => (
          <div
            key={i}
            data-testid="curriculum-chapter-row-skeleton"
            className={CHAPTER_ROW_BASE_CLASS}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="flex flex-wrap items-center gap-2 text-sm font-bold">
                <SkeletonBar
                  as="span"
                  className={`inline-block ${CHAPTER_TITLE_WIDTH_CLASSES[i % CHAPTER_TITLE_WIDTH_CLASSES.length]}`}
                >
                  &nbsp;
                </SkeletonBar>
              </span>
              <span className="text-xs">
                <SkeletonBar
                  as="span"
                  tone={100}
                  className={`inline-block ${CHAPTER_DESCRIPTION_WIDTH_CLASSES[i % CHAPTER_DESCRIPTION_WIDTH_CLASSES.length]}`}
                >
                  &nbsp;
                </SkeletonBar>
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 章タイトルの幅。1 行に収まる長さで循環させ、同じ幅が並ばないようにする */
const CHAPTER_TITLE_WIDTH_CLASSES = ["w-40", "w-28", "w-36", "w-32"] as const;

/** 章の説明文の幅。タイトルより長い一文なので広めに取る */
const CHAPTER_DESCRIPTION_WIDTH_CLASSES = [
  "w-2/3",
  "w-1/2",
  "w-3/5",
  "w-7/12",
] as const;
