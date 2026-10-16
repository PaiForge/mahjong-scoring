import { createStore } from "zustand/vanilla";
import type { MobileExamGoalsResponse } from "@mahjong-scoring/features/exam/mobile-api";

/**
 * 昇級試験の合格ラインの読み込みの状態（React に触れない部分）
 *
 * 説明画面の合格条件と本番の開始ボタンが同じ値を読むよう、アプリで 1 つの
 * ストアに持つ。フックは `use-exam-goal.ts`。
 */
export interface ExamGoalsState {
  /** 最後に読めた合格ライン（menuType → 正解数）。まだ 1 度も読めていなければ undefined */
  readonly goals: Readonly<Record<string, number>> | undefined;
  /** 最後に終わった読み込みが失敗したか */
  readonly failed: boolean;
  /** 始めた読み込みの通し番号 */
  readonly requested: number;
  /** 終わった読み込みの通し番号 */
  readonly settled: number;
}

/**
 * 1 つの試験の合格ライン
 *
 * - `loading` — 画面を開いてからの読み込みがまだ終わっていない（読み直しの
 *   途中も含む）。`goal` は前に読めた値（無ければ undefined）で、確かめ直す
 *   前の値
 * - `loaded` — 画面を開いてから読んだサーバーの値
 * - `failed` — 読めなかった（応答にこの試験が無いときも含む）
 */
export type ExamGoal =
  | { readonly status: "loading"; readonly goal: number | undefined }
  | { readonly status: "loaded"; readonly goal: number }
  | { readonly status: "failed" };

/**
 * ストアの状態から 1 つの試験の合格ラインを読む
 * 試験合格ライン判定
 *
 * @param openedAfter - 画面を開いた時点の `requested`。これより後に始まった
 *   読み込みが終われば、開いた後の値になる
 */
export function deriveExamGoal(
  state: ExamGoalsState,
  menuType: string,
  openedAfter: number,
): ExamGoal {
  const goal = state.goals?.[menuType];
  if (state.settled <= openedAfter || state.requested > state.settled)
    return { status: "loading", goal };
  if (state.failed || goal === undefined) return { status: "failed" };
  return { status: "loaded", goal };
}

/**
 * 合格ラインのストアと、読み直しの操作を作る
 * 試験合格ラインストア作成
 *
 * 読み直しは、読んでいる途中なら終わってからもう 1 度読む。途中の読み込みは
 * 頼まれる前に始まったもので、頼んだ画面を開いた後の値とは言えないため。
 * 同時に開いた画面の読み直しは、その 1 度にまとまる。
 *
 * @param fetchGoals - 合格ラインを読む。読めなければ undefined
 */
export function createExamGoalsStore(
  fetchGoals: () => Promise<MobileExamGoalsResponse | undefined>,
) {
  const store = createStore<ExamGoalsState>()(() => ({
    goals: undefined,
    failed: false,
    requested: 0,
    settled: 0,
  }));
  let inflight = false;
  let again = false;

  function refresh(): void {
    if (inflight) {
      again = true;
      return;
    }
    inflight = true;
    const id = store.getState().requested + 1;
    store.setState({ requested: id });
    void fetchGoals().then((response) => {
      inflight = false;
      store.setState((state) => ({
        goals: response?.goals ?? state.goals,
        failed: response === undefined,
        settled: id,
      }));
      if (again) {
        again = false;
        refresh();
      }
    });
  }

  return { store, refresh };
}
