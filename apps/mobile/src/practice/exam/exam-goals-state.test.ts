import { describe, expect, it } from "vitest";
import type { MobileExamGoalsResponse } from "@mahjong-scoring/features/exam/mobile-api";

import { createExamGoalsStore, deriveExamGoal } from "./exam-goals-state";

/** 呼ばれるたびに、外から解決できる約束を返す読み込み */
function controllableFetch() {
  const pending: ((value: MobileExamGoalsResponse | undefined) => void)[] = [];
  return {
    fetch: () =>
      new Promise<MobileExamGoalsResponse | undefined>((resolve) => {
        pending.push(resolve);
      }),
    calls: () => pending.length,
    resolve: async (
      index: number,
      value: MobileExamGoalsResponse | undefined,
    ) => {
      pending[index]?.(value);
      await Promise.resolve();
    },
  };
}

const MENU = "fu_score_exam";

describe("examGoals", () => {
  it("開いた後の読み込みが終わるまでは loading", async () => {
    const remote = controllableFetch();
    const { store, refresh } = createExamGoalsStore(remote.fetch);
    const openedAfter = store.getState().requested;
    refresh();

    expect(deriveExamGoal(store.getState(), MENU, openedAfter)).toEqual({
      status: "loading",
      goal: undefined,
    });
    await remote.resolve(0, { goals: { [MENU]: 5 } });
    expect(deriveExamGoal(store.getState(), MENU, openedAfter)).toEqual({
      status: "loaded",
      goal: 5,
    });
  });

  // スタックに残った画面へ戻ったとき・前面へ戻ったときも、フックは基準を
  // その時点の requested に取り直して読み直す（`use-exam-goal.ts`）
  it("表示し直すと、読み直すまで前の値を確定扱いにしない", async () => {
    const remote = controllableFetch();
    const { store, refresh } = createExamGoalsStore(remote.fetch);
    refresh();
    await remote.resolve(0, { goals: { [MENU]: 5 } });

    const reopened = store.getState().requested;
    // 表示し直した直後（読み直しを始める前）も、前の値は確定扱いにしない
    expect(deriveExamGoal(store.getState(), MENU, reopened)).toEqual({
      status: "loading",
      goal: 5,
    });
    refresh();
    await remote.resolve(1, { goals: { [MENU]: 6 } });
    expect(deriveExamGoal(store.getState(), MENU, reopened)).toEqual({
      status: "loaded",
      goal: 6,
    });
  });

  it("開く前から読んでいた読み込みでは確定せず、終わってからもう 1 度読む", async () => {
    const remote = controllableFetch();
    const { store, refresh } = createExamGoalsStore(remote.fetch);
    refresh();
    const openedAfter = store.getState().requested;
    refresh();

    await remote.resolve(0, { goals: { [MENU]: 5 } });
    expect(deriveExamGoal(store.getState(), MENU, openedAfter).status).toBe(
      "loading",
    );
    expect(remote.calls()).toBe(2);
    await remote.resolve(1, { goals: { [MENU]: 6 } });
    expect(deriveExamGoal(store.getState(), MENU, openedAfter)).toEqual({
      status: "loaded",
      goal: 6,
    });
  });

  it("読めなければ前に読めた値があっても failed", async () => {
    const remote = controllableFetch();
    const { store, refresh } = createExamGoalsStore(remote.fetch);
    refresh();
    await remote.resolve(0, { goals: { [MENU]: 5 } });
    const reopened = store.getState().requested;
    refresh();
    await remote.resolve(1, undefined);

    expect(deriveExamGoal(store.getState(), MENU, reopened)).toEqual({
      status: "failed",
    });
  });

  it("応答にその試験が無ければ failed", async () => {
    const remote = controllableFetch();
    const { store, refresh } = createExamGoalsStore(remote.fetch);
    refresh();
    await remote.resolve(0, { goals: {} });

    expect(deriveExamGoal(store.getState(), MENU, 0)).toEqual({
      status: "failed",
    });
  });

  it("読み直しの途中は loading に戻り、終われば loaded", async () => {
    const remote = controllableFetch();
    const { store, refresh } = createExamGoalsStore(remote.fetch);
    refresh();
    await remote.resolve(0, undefined);
    expect(deriveExamGoal(store.getState(), MENU, 0).status).toBe("failed");

    refresh();
    expect(deriveExamGoal(store.getState(), MENU, 0).status).toBe("loading");
    await remote.resolve(1, { goals: { [MENU]: 5 } });
    expect(deriveExamGoal(store.getState(), MENU, 0)).toEqual({
      status: "loaded",
      goal: 5,
    });
  });
});
