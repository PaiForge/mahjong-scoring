import Link from "next/link";

import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { beltTintClasses } from "@/lib/ranks/belt-colors";
import {
  countProgress,
  currentStage,
  type JourneyStage,
  type RankJourney,
} from "@mahjong-scoring/features/journey/journey";

import { dojoStageHref } from "../_lib/stage-anchors";

interface RankStageProgressProps {
  readonly journey: RankJourney;
  /** `ranks` 名前空間の翻訳関数（呼び出し側が引いたものを渡す） */
  readonly tRanks: (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  /**
   * いま取り組む級（ダッシュボードのカード・道場で開いた級）か。そうなら
   * いま取り組んでいる段を帯色で塗り、各段を道場で開いた級の該当セクション
   * へのリンクにする。閉じた級まで塗ると道場の一覧に「今ここ」が級の数だけ
   * 並び、閉じた級の段には着地先のセクションが無い
   */
  readonly isCurrentRank?: boolean;
  /** 余白などレイアウト調整用 */
  readonly className?: string;
  /** スポットライトツアーが照らす対象の id */
  readonly dataTourId?: string;
}

/** 1 段分の表示 */
interface StageCell {
  readonly stage: JourneyStage;
  readonly value: string;
  readonly done: boolean;
}

/**
 * 級の進み具合（学ぶ → 練習する → 試験）のステップ表示
 * 段級位の進み具合
 *
 * ダッシュボードの「次にやること」と道場の級カードが同じ形で出す。段を
 * 等幅の列に並べ、列の境目に矢印を置いて「学ぶ → 練習する → 試験」の順を
 * 見せる。各列は段の名前と値（「2 / 5」「未受験」）の 2 行。済んだ段は
 * 値にチェックを添え、いま取り組んでいる段（`currentStage`）は級の帯色の
 * 淡い面で塗る。以前は 1 行に「学ぶ 0 / 5 練習する 0 / 6 試験 未受験」と
 * 詰めていたが、名前と値の区切りが読み取れなかった。
 *
 * いま取り組む級では各段が道場の該当セクション（レッスン・練習の一覧、
 * 試験への導線）へのリンクになる。読みに行くだけの導線なので、押せる面
 * （太枠 + 影）にはせず、段の名前に行リンクと同じ常時の下線を引く。
 *
 * 前提章を持たない級（初段）では学ぶ・練習するが 0 件なので、数えるものが
 * ある段だけ並べる。
 *
 * 呼び出し側のテストが async なサーバーコンポーネントを 1 段だけ await して
 * 描画するため、翻訳関数は受け取って同期で描く。
 */
export function RankStageProgress({
  journey,
  tRanks,
  isCurrentRank = false,
  className,
  dataTourId,
}: RankStageProgressProps) {
  const learn = countProgress(journey.chapters);
  const practice = countProgress(journey.practices);
  const current = isCurrentRank ? currentStage(journey) : undefined;

  const cells: readonly StageCell[] = [
    ...(learn.total > 0
      ? [
          {
            stage: "learn" as const,
            value: tRanks("stageCount", { ...learn }),
            done: learn.done === learn.total,
          },
        ]
      : []),
    ...(practice.total > 0
      ? [
          {
            stage: "practice" as const,
            value: tRanks("stageCount", { ...practice }),
            done: practice.done === practice.total,
          },
        ]
      : []),
    {
      stage: "exam",
      value: tRanks(
        journey.exam.done ? "stageExamPassed" : "stageExamNotTaken",
      ),
      done: journey.exam.done,
    },
  ];

  return (
    <ol
      className={[
        "flex divide-x-2 divide-surface-200 rounded-lg border-2 border-surface-200",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-tour-id={dataTourId}
    >
      {cells.map((cell, index) => {
        const isCurrent = cell.stage === current;
        const rounded = [
          index === 0 ? "rounded-l-md" : "",
          index === cells.length - 1 ? "rounded-r-md" : "",
        ].join(" ");
        const content = (
          <>
            <span
              className={`text-xs font-bold ${isCurrentRank ? ROW_LINK_TITLE_CLASSES : ""}`}
            >
              {tRanks(`stages.${cell.stage}`)}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
              {cell.done && <CheckIcon className="size-3.5 text-primary-600" />}
              {cell.value}
            </span>
          </>
        );
        const cellClasses =
          "flex h-full flex-col items-center gap-0.5 px-1 py-2 text-center";
        return (
          <li
            key={cell.stage}
            aria-current={isCurrent ? "step" : undefined}
            data-stage={cell.stage}
            className={[
              "relative min-w-0 flex-1",
              rounded,
              isCurrent
                ? beltTintClasses(journey.rank.slug)
                : "text-surface-600",
            ].join(" ")}
          >
            {isCurrentRank ? (
              <Link
                href={dojoStageHref(cell.stage)}
                className={`group ${cellClasses} ${rounded} transition-colors hover:bg-surface-900/5 ${FOCUS_RING_CLASSES}`}
              >
                {content}
              </Link>
            ) : (
              <div className={cellClasses}>{content}</div>
            )}
            {index < cells.length - 1 && (
              <ChevronRightIcon className="absolute top-1/2 -right-[11px] z-10 size-5 -translate-y-1/2 rounded-full bg-white p-0.5 text-surface-400" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
