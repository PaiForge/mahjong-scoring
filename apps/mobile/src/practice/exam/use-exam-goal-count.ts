import { useEffect, useState } from "react";
import type { MobileExamGoalsResponse } from "@mahjong-scoring/features/exam/mobile-api";

import { fetchExamGoals } from "./exam-goals-api";

/** 読めた合格ライン。アプリを動かしている間は読み直さない */
let loaded: MobileExamGoalsResponse | undefined;
/** 読んでいる途中の要求（同時に開いた画面で 1 本にまとめる） */
let inflight: Promise<MobileExamGoalsResponse | undefined> | undefined;

function loadExamGoals(): Promise<MobileExamGoalsResponse | undefined> {
  inflight ??= fetchExamGoals().then((goals) => {
    loaded = goals;
    // 読めなかったら次に開いたときに読み直す
    inflight = undefined;
    return goals;
  });
  return inflight;
}

/**
 * 昇級試験の合格ライン。サーバーの値を優先し、読むまで・読めないときは
 * 手元の値
 * 試験合格ライン参照
 *
 * 説明画面の合格条件を、開始後に求める値（開始の応答の `goalCount`）と
 * 揃えるため（`exam/mobile-api.ts` 参照）。サーバーの値はアプリを動かして
 * いる間に 1 度だけ読む。
 *
 * @param menuType - 試験の menuType
 * @param fallback - 手元のレジストリの合格ライン
 */
export function useExamGoalCount(menuType: string, fallback: number): number {
  const [goals, setGoals] = useState(loaded);
  useEffect(() => {
    if (goals !== undefined) return;
    let active = true;
    void loadExamGoals().then((value) => {
      if (active && value !== undefined) setGoals(value);
    });
    return () => {
      active = false;
    };
  }, [goals]);
  return goals?.goals[menuType] ?? fallback;
}
