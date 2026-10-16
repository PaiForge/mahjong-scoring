import { useEffect, useState } from "react";
import { useStore } from "zustand";

import { fetchExamGoals } from "./exam-goals-api";
import {
  createExamGoalsStore,
  deriveExamGoal,
  type ExamGoal,
} from "./exam-goals-state";

const { store, refresh } = createExamGoalsStore(fetchExamGoals);

/**
 * 昇級試験の合格ラインを、画面を開くたびにサーバーから読み直して返す
 * 試験合格ライン参照
 *
 * 本番の終了と合否はサーバーの合格ライン（開始の応答の `goalCount`）で
 * 決まる。説明画面に手元のレジストリの値や、前に開いたときの値を確定した
 * 条件として出すと、サーバーが合格ラインを変えたあとに、案内した条件を
 * 満たしても不合格になる。そのため画面を開くたびに読み直し、読み終わるまで
 * 本番を始めさせない（`ExamStartGate`）。読み直している間は前に読めた値を
 * 出しておく（同じ値なら表示が揺れない）。
 *
 * @param menuType - 試験の menuType
 */
export function useExamGoal(menuType: string): {
  readonly goal: ExamGoal;
  readonly retry: () => void;
} {
  const [openedAfter] = useState(() => store.getState().requested);
  const state = useStore(store);
  useEffect(refresh, []);
  return { goal: deriveExamGoal(state, menuType, openedAfter), retry: refresh };
}
