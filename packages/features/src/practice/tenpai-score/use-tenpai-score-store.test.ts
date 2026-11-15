import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import type { TenpaiScoreQuestion } from "@mahjong-scoring/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createTenpaiScoreStore } from "./use-tenpai-score-store";

/**
 * 聴牌形の生成には必ず失敗させる出題条件が無いため、生成器だけ失敗に
 * 差し替えられるようにする（既定は本物を呼ぶ）
 */
const generator = vi.hoisted(() => ({ forceFailure: false }));

vi.mock("@mahjong-scoring/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mahjong-scoring/core")>();
  return {
    ...actual,
    generateValidTenpaiScoreQuestion: (
      ...args: Parameters<typeof actual.generateValidTenpaiScoreQuestion>
    ) =>
      generator.forceFailure
        ? undefined
        : actual.generateValidTenpaiScoreQuestion(...args),
  };
});

afterEach(() => {
  generator.forceFailure = false;
  vi.restoreAllMocks();
});

describe("聴牌形の点数計算のストアの採用通知", () => {
  it("問題を作れたら、ストアに入れた問題で 1 回だけ通知する", () => {
    const adopted: TenpaiScoreQuestion[] = [];
    const store = createTenpaiScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      (question) => adopted.push(question),
    );

    store.getState().generateNewQuestion();

    const current = store.getState().currentQuestion;
    expect(current).toBeDefined();
    expect(adopted).toEqual([current]);
  });

  it("生成に失敗したら通知しない", () => {
    generator.forceFailure = true;
    const onQuestionAdopted = vi.fn();
    const store = createTenpaiScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      onQuestionAdopted,
    );

    store.getState().generateNewQuestion();

    expect(store.getState().generationFailed).toBe(true);
    expect(onQuestionAdopted).not.toHaveBeenCalled();
  });

  it("setQuestion（設定画面へ戻る前のクリアを含む）では通知しない", () => {
    const onQuestionAdopted = vi.fn();
    const store = createTenpaiScoreStore(
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
    const store = createTenpaiScoreStore(
      () => DEFAULT_RULE_SETTINGS,
      onQuestionAdopted,
    );

    store.getState().applyPracticeQuery("variant=all", { includeFuro: false });

    expect(onQuestionAdopted).not.toHaveBeenCalled();
  });

  it("通知が投げても問題はストアに入り、例外は外へ出ない", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createTenpaiScoreStore(
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
    const store = createTenpaiScoreStore(() => DEFAULT_RULE_SETTINGS);

    store.getState().generateNewQuestion();

    expect(store.getState().currentQuestion).toBeDefined();
  });
});
