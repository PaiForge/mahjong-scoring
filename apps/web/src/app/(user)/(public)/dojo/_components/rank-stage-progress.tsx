import Link from "next/link";

import { DoneMark } from "@/app/(user)/_components/done-mark";
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

import { practiceHref } from "@mahjong-scoring/features/routes";

import { lessonListHref } from "../../lessons/_lib/lesson-list-href";
import { practiceListHref } from "../../practice/_lib/practice-web-routes";

interface RankStageProgressProps {
  readonly journey: RankJourney;
  /** `ranks` 名前空間の翻訳関数（呼び出し側が引いたものを渡す） */
  readonly tRanks: (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  /**
   * いま取り組む級（ダッシュボードのカード・道場で開いた級）か。そうなら
   * いま取り組んでいる段を帯色で塗り、各段をその段の一覧へのリンクにする。
   * 閉じた級まで塗ると道場の一覧に「今ここ」が級の数だけ並び、リンクも
   * 道場の中で級の数だけ重なる
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
 * 段の行き先 — 学ぶはレッスン一覧のその級の節、練習するはその級で絞った
 * 練習一覧、試験は試験の説明ページ
 */
function stageHref(stage: JourneyStage, journey: RankJourney): string {
  switch (stage) {
    case "learn":
      return lessonListHref(journey.rank.slug);
    case "practice":
      return practiceListHref({ kind: "rank", value: journey.rank.slug });
    case "exam":
      return practiceHref(journey.exam.slug);
  }
}

/**
 * 級の進み具合（学ぶ → 練習する → 試験）のステップ表示
 * 段級位の進み具合
 *
 * ダッシュボードの「次にやること」と道場の級カードが同じ形で出す。段を
 * 等幅の列に並べ、列の境目に矢印を置いて「学ぶ → 練習する → 試験」の順を
 * 見せる。各列は段の名前と値（「2 / 5」「未合格」）の 2 行。いま取り組んで
 * いる段（`currentStage`）は級の帯色の淡い面で塗り、済んだ段は面を塗らずに
 * 値を緑の文字にして済みの印（{@link DoneMark}）を添え、まだの段はグレーに
 * 置く。済んだ段まで面で塗ると色の面が 1 行に複数並んで「今」が弱まり、
 * 緑の帯の級では済んだ段と今の段が同じ色になる。「面 = 今・緑の印 = 済み・
 * グレー = これから」と手段を分けておけば、今の段は最初の未了なので
 * 左から「済み → 今 → これから」の順に読める。以前は 1 行に「学ぶ 0 / 5 練習する 0 / 6 試験 未受験」と
 * 詰めていたが、名前と値の区切りが読み取れなかった。
 *
 * 試験の値は合格までは「未合格」で、「未受験」とは言わない。試験は不合格を
 * 記録しないので受けていない人と落ちた人を見分けられず、落ちた人に
 * 「未受験」は事実と違う。
 *
 * いま取り組む級では各段がその段の一覧へのリンクになる（{@link stageHref}）。
 * 練習するの行き先はボタンの下の「自分で練習を選ぶ」と同じ。一覧を見に行く
 * だけの導線なので、押せる面（太枠 + 影）にはせず、段の名前に行リンクと
 * 同じ常時の下線を引く。
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
        journey.exam.done ? "stageExamPassed" : "stageExamNotPassed",
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
            <span
              className={`flex items-center gap-1 text-sm font-bold tabular-nums ${cell.done ? "text-primary-700" : ""}`}
            >
              {cell.done && <DoneMark size="sm" />}
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
                href={stageHref(cell.stage, journey)}
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
