import { describe, expect, it } from "vitest";

import {
  INITIAL_LEADERBOARD_VISIBILITY_STATE,
  canToggleLeaderboardVisibility,
  reduceLeaderboardVisibility,
  type LeaderboardVisibilityAction,
  type LeaderboardVisibilityState,
} from "./leaderboard-visibility-state";

function run(
  actions: readonly LeaderboardVisibilityAction[],
  from: LeaderboardVisibilityState = INITIAL_LEADERBOARD_VISIBILITY_STATE,
): LeaderboardVisibilityState {
  return actions.reduce(reduceLeaderboardVisibility, from);
}

/** 1 回目の読み込みで hidden を読めた状態 */
function loaded(hidden: boolean): LeaderboardVisibilityState {
  return run([
    { type: "loadStarted", load: 1 },
    { type: "loadSucceeded", load: 1, hidden },
  ]);
}

describe("reduceLeaderboardVisibility", () => {
  it("読めた値を出す", () => {
    expect(loaded(true).hidden).toBe(true);
  });

  it("後から始めた読み込みだけを受け付ける", () => {
    const state = run([
      { type: "loadStarted", load: 1 },
      { type: "loadStarted", load: 2 },
      { type: "loadSucceeded", load: 1, hidden: true },
    ]);
    expect(state.hidden).toBeUndefined();
    expect(
      reduceLeaderboardVisibility(state, {
        type: "loadSucceeded",
        load: 2,
        hidden: false,
      }).hidden,
    ).toBe(false);
  });

  it("保存中は次の切り替えを受け付けない（POST を直列にする）", () => {
    const state = run([{ type: "saveStarted", hidden: true }], loaded(false));
    expect(canToggleLeaderboardVisibility(state)).toBe(false);
    expect(
      reduceLeaderboardVisibility(state, { type: "saveStarted", hidden: false })
        .hidden,
    ).toBe(true);
  });

  it("保存の前に始まった読み込みが保存の後に返っても、押した値を戻さない", () => {
    const state = run(
      [
        { type: "loadStarted", load: 2 },
        { type: "saveStarted", hidden: true },
        { type: "saveSucceeded" },
        // 保存前の値（false）を読んでいた GET が遅れて返る
        { type: "loadSucceeded", load: 2, hidden: false },
      ],
      loaded(false),
    );
    expect(state.hidden).toBe(true);
    expect(canToggleLeaderboardVisibility(state)).toBe(true);
  });

  it("保存中に始まった読み込みも受け付けない", () => {
    const state = run(
      [
        { type: "saveStarted", hidden: true },
        { type: "loadStarted", load: 2 },
        { type: "saveSucceeded" },
        { type: "loadSucceeded", load: 2, hidden: false },
      ],
      loaded(false),
    );
    expect(state.hidden).toBe(true);
  });

  it("保存の後に始めた読み込みの値は受け付ける（web で切り替えた値を映す）", () => {
    const state = run(
      [
        { type: "saveStarted", hidden: true },
        { type: "saveSucceeded" },
        { type: "loadStarted", load: 2 },
        { type: "loadSucceeded", load: 2, hidden: false },
      ],
      loaded(false),
    );
    expect(state.hidden).toBe(false);
  });

  it("保存に失敗したら押す前の値に戻し、失敗を残す", () => {
    const state = run(
      [{ type: "saveStarted", hidden: true }, { type: "saveFailed" }],
      loaded(false),
    );
    expect(state.hidden).toBe(false);
    expect(state.saveFailed).toBe(true);
    expect(canToggleLeaderboardVisibility(state)).toBe(true);
  });

  it("読み込みの失敗は、読めている値を消さない", () => {
    const state = run(
      [
        { type: "loadStarted", load: 2 },
        { type: "loadFailed", load: 2 },
      ],
      loaded(true),
    );
    expect(state.hidden).toBe(true);
    expect(state.loadFailed).toBe(false);
  });

  it("1 度も読めないまま失敗したら、失敗として出す", () => {
    const state = run([
      { type: "loadStarted", load: 1 },
      { type: "loadFailed", load: 1 },
    ]);
    expect(state.loadFailed).toBe(true);
    expect(canToggleLeaderboardVisibility(state)).toBe(false);
  });
});
