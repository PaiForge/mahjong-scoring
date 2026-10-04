import {
  countProgress,
  type RankJourney,
} from "@mahjong-scoring/features/journey/journey";

interface RankStageProgressProps {
  readonly journey: RankJourney;
  /** `ranks` 名前空間の翻訳関数（呼び出し側が引いたものを渡す） */
  readonly tRanks: (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  /** 余白などレイアウト調整用 */
  readonly className?: string;
  /** スポットライトツアーが照らす対象の id */
  readonly dataTourId?: string;
}

/**
 * 級の進み具合（学ぶ・練習する・認定される）の 1 行
 * 段級位の進み具合
 *
 * ダッシュボードの「次の一歩」と道場の級カードが同じ並びで出す。前提章を
 * 持たない級（初段）では学ぶ・練習するが 0 件なので、数えるものがある段だけ並べる。
 *
 * 呼び出し側のテストが async なサーバーコンポーネントを 1 段だけ await して
 * 描画するため、翻訳関数は受け取って同期で描く。
 */
export function RankStageProgress({
  journey,
  tRanks,
  className,
  dataTourId,
}: RankStageProgressProps) {
  const learn = countProgress(journey.chapters);
  const practice = countProgress(journey.practices);

  return (
    <dl
      className={[
        "flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-600",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-tour-id={dataTourId}
    >
      {learn.total > 0 && (
        <div className="flex gap-1">
          <dt className="font-bold">{tRanks("stages.learn")}</dt>
          <dd className="tabular-nums">
            {tRanks("stageCount", { done: learn.done, total: learn.total })}
          </dd>
        </div>
      )}
      {practice.total > 0 && (
        <div className="flex gap-1">
          <dt className="font-bold">{tRanks("stages.practice")}</dt>
          <dd className="tabular-nums">
            {tRanks("stageCount", {
              done: practice.done,
              total: practice.total,
            })}
          </dd>
        </div>
      )}
      <div className="flex gap-1">
        <dt className="font-bold">{tRanks("stages.exam")}</dt>
        <dd>
          {tRanks(journey.exam.done ? "stageExamPassed" : "stageExamNotTaken")}
        </dd>
      </div>
    </dl>
  );
}
