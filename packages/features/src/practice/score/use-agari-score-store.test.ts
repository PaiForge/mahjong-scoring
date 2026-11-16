import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createAgariScoreStore } from "./use-agari-score-store";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("和了形の点数計算のストアの採用通知", () => {
  it("問題を作れたら、ストアに入れた問題で 1 回だけ通知する", () => {
    const adopted: ScoreQuestion[] = [];
    const store = createAgariScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      (question) => adopted.push(question),
    );

    store.getState().generateNewQuestion();

    const current = store.getState().currentQuestion;
    expect(current).toBeDefined();
    expect(adopted).toEqual([current]);
  });

  it("生成に失敗したら通知しない", () => {
    const onQuestionAdopted = vi.fn();
    const store = createAgariScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      onQuestionAdopted,
    );
    // 100 翻以上の手は作れないので、必ずリトライを使い切る
    store.setState({ options: { ...store.getState().options, minHan: 100 } });

    store.getState().generateNewQuestion();

    expect(store.getState().generationFailed).toBe(true);
    expect(onQuestionAdopted).not.toHaveBeenCalled();
  });

  it("setQuestion（設定画面へ戻る前のクリアを含む）では通知しない", () => {
    const onQuestionAdopted = vi.fn();
    const store = createAgariScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      onQuestionAdopted,
    );
    store.getState().generateNewQuestion();
    const generated = store.getState().currentQuestion;
    onQuestionAdopted.mockClear();

    store.getState().setQuestion(undefined);
    store.getState().setQuestion(generated);

    expect(onQuestionAdopted).not.toHaveBeenCalled();
  });

  it("applyPracticeQuery では通知しない", () => {
    const onQuestionAdopted = vi.fn();
    const store = createAgariScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      onQuestionAdopted,
    );

    store.getState().applyPracticeQuery("variant=all", { includeFuro: false });

    expect(onQuestionAdopted).not.toHaveBeenCalled();
  });

  it("通知が投げても問題はストアに入り、例外は外へ出ない", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createAgariScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      () => {
        throw new Error("boom");
      },
    );

    expect(() => store.getState().generateNewQuestion()).not.toThrow();

    expect(store.getState().currentQuestion).toBeDefined();
    expect(store.getState().generationFailed).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("通知を渡さなくても出題できる（既存の呼び出しは引数 1 つのまま）", () => {
    const store = createAgariScoreStore(() => DEFAULT_RULE_SETTINGS);

    store.getState().generateNewQuestion();

    expect(store.getState().currentQuestion).toBeDefined();
  });
});
