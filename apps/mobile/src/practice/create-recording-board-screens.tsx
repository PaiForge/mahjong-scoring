import type { ReactNode } from "react";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";

import {
  createChallengePlayView,
  createTrainingView,
} from "./create-practice-views";
import type { PracticeScreens } from "./practice-screens";

interface RecordingBoardScreensConfig<TResult> {
  readonly slug: PracticeMenuSlug;
  /** 出題条件などの固有の props を持たない盤面 */
  readonly Board: (props: RecordingPracticeBoardProps<TResult>) => ReactNode;
  /** 結果画面の問題別一覧 */
  readonly ProblemList: (props: {
    readonly results: readonly TResult[];
  }) => ReactNode;
  /** メモリの結果（`unknown[]`）を盤面の結果スキーマで検証する */
  readonly parseResults: (results: readonly unknown[]) => readonly TResult[];
}

/**
 * 盤面と問題別一覧だけで決まる練習の画面一式を作る
 * 記録付き盤面の画面一式生成
 *
 * 盤面が共通の props（{@link RecordingPracticeBoardProps}）だけを受け取る練習
 * （符・翻を選択肢で即答するもの）は、チャレンジ・トレーニング・見本の盤面への
 * 渡し方が同じになる。
 *
 * - チャレンジ: 正誤の表示・カウントダウン・回答・結果の記録・出題の届け出
 * - トレーニング: 正誤の表示・回答だけ（記録しない）
 * - 見本（説明画面）: 正誤を出さず、回答しても何も起きない本物の盤面
 *
 * 盤面に固有の props（出題範囲・トレーニングの表示）を渡す練習、ヘルプや
 * 専用の見本を持つ練習は、これを使わず `createChallengePlayView` /
 * `createTrainingView` を直接組む。ここに選択肢の引数を足して吸収しない。
 */
export function createRecordingBoardScreens<TResult>(
  config: RecordingBoardScreensConfig<TResult>,
): PracticeScreens {
  const { slug, Board, ProblemList, parseResults } = config;
  return {
    Play: createChallengePlayView<TResult>({
      slug,
      renderBoard: (args) => (
        <Board
          showFeedback={args.showFeedback}
          isCountingDown={args.isCountingDown}
          onAnswer={args.onAnswer}
          onRecordResult={args.recordResult}
          onPresentQuestion={args.presentQuestion}
        />
      ),
    }),
    Training: createTrainingView({
      slug,
      renderBoard: (args) => (
        <Board showFeedback={args.showFeedback} onAnswer={args.onAnswer} />
      ),
    }),
    Demo: () => <Board showFeedback={false} onAnswer={() => undefined} />,
    ProblemList: ({ results }) => (
      <ProblemList results={parseResults(results)} />
    ),
  };
}
