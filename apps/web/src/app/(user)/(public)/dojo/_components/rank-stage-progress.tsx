import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { beltTintClasses } from "@/lib/ranks/belt-colors";
import {
  countProgress,
  currentStage,
  type JourneyStage,
  type RankJourney,
} from "@mahjong-scoring/features/journey/journey";

interface RankStageProgressProps {
  readonly journey: RankJourney;
  /** `ranks` 名前空間の翻訳関数（呼び出し側が引いたものを渡す） */
  readonly tRanks: (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  /**
   * いま取り組んでいる段を帯色で塗るか。いま取り組む級（ダッシュボードの
   * カード・道場で開いた級）だけが渡す。閉じた級まで塗ると、道場の一覧に
   * 「今ここ」が級の数だけ並ぶ
   */
  readonly highlightCurrent?: boolean;
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
 * 前提章を持たない級（初段）では学ぶ・練習するが 0 件なので、数えるものが
 * ある段だけ並べる。押せる面ではないので影は付けない。
 *
 * 呼び出し側のテストが async なサーバーコンポーネントを 1 段だけ await して
 * 描画するため、翻訳関数は受け取って同期で描く。
 */
export function RankStageProgress({
  journey,
  tRanks,
  highlightCurrent = false,
  className,
  dataTourId,
}: RankStageProgressProps) {
  const learn = countProgress(journey.chapters);
  const practice = countProgress(journey.practices);
  const current = highlightCurrent ? currentStage(journey) : undefined;

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
        return (
          <li
            key={cell.stage}
            aria-current={isCurrent ? "step" : undefined}
            data-stage={cell.stage}
            className={[
              "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-center",
              index === 0 ? "rounded-l-md" : "",
              index === cells.length - 1 ? "rounded-r-md" : "",
              isCurrent
                ? beltTintClasses(journey.rank.slug)
                : "text-surface-600",
            ].join(" ")}
          >
            <span className="text-xs font-bold">
              {tRanks(`stages.${cell.stage}`)}
            </span>
            <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
              {cell.done && <CheckIcon className="size-3.5 text-primary-600" />}
              {cell.value}
            </span>
            {index < cells.length - 1 && (
              <ChevronRightIcon className="absolute top-1/2 -right-[11px] z-10 size-5 -translate-y-1/2 rounded-full bg-white p-0.5 text-surface-400" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
