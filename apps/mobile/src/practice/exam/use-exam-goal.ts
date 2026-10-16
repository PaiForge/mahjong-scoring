import { useCallback, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useStore } from "zustand";

import { fetchExamGoals } from "./exam-goals-api";
import {
  createExamGoalsStore,
  deriveExamGoal,
  type ExamGoal,
} from "./exam-goals-state";

const { store, refresh } = createExamGoalsStore(fetchExamGoals);

/**
 * 昇級試験の合格ラインを、画面を表示するたびにサーバーから読み直して返す
 * 試験合格ライン参照
 *
 * 本番の終了と合否はサーバーの合格ライン（開始の応答の `goalCount`）で
 * 決まる。説明画面に手元のレジストリの値や、前に表示したときの値を確定した
 * 条件として出すと、サーバーが合格ラインを変えたあとに、案内した条件を
 * 満たしても不合格になる。そのため表示のたびに読み直し、読み終わるまで
 * 本番を始めさせない（`ExamStartGate`）。読み直している間は前に読めた値を
 * 出しておく（同じ値なら表示が揺れない）。
 *
 * 「表示のたび」は初めて開いたときだけでなく、スタックに残った画面へ
 * 戻ったとき（模試を閉じて説明画面へ戻る等。画面は作り直されない）と、
 * 画面を出したままアプリが前面へ戻ったときを含む。どちらも読み直しの
 * 基準（`openedAfter`）をその時点に取り直し、前の値を確定扱いに戻さない。
 *
 * @param menuType - 試験の menuType
 */
export function useExamGoal(menuType: string): {
  readonly goal: ExamGoal;
  readonly retry: () => void;
} {
  const [openedAfter, setOpenedAfter] = useState(
    () => store.getState().requested,
  );
  const state = useStore(store);

  const revalidate = useCallback(() => {
    setOpenedAfter(store.getState().requested);
    refresh();
  }, []);

  useFocusEffect(
    useCallback(() => {
      revalidate();
      const sub = AppState.addEventListener("change", (appState) => {
        if (appState === "active") revalidate();
      });
      return () => sub.remove();
    }, [revalidate]),
  );

  return { goal: deriveExamGoal(state, menuType, openedAfter), retry: refresh };
}
