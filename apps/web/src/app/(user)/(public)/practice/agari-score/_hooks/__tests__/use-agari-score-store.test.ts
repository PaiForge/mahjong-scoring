import { beforeEach, describe, expect, it } from "vitest";
import type { UserAnswer } from "@mahjong-scoring/core";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";

import { useAgariScoreStore } from "../use-agari-score-store";

/** 各テストで出題済みの状態を作る（生成器は core の実物を使う） */
function seedQuestion() {
  const question = generateValidScoreQuestion({
    includeFuro: true,
    includeChiitoi: false,
    allowedRanges: ["nonMangan", "manganPlus"],
  });
  useAgariScoreStore.getState().setQuestion(question);
  return question;
}

describe("useAgariScoreStore revealAnswer", () => {
  beforeEach(() => {
    useAgariScoreStore.setState({
      currentQuestion: undefined,
      userAnswer: undefined,
      judgementResult: undefined,
      isAnswered: false,
      stats: { total: 0, correct: 0 },
    });
  });

  it("無回答のまま開示状態にし、統計は変えない", () => {
    seedQuestion();

    useAgariScoreStore.getState().revealAnswer();

    const state = useAgariScoreStore.getState();
    expect(state.isAnswered).toBe(true);
    expect(state.userAnswer).toBeUndefined();
    expect(state.judgementResult).toBeUndefined();
    expect(state.stats).toEqual({ total: 0, correct: 0 });
  });

  it("問題が無いときは何もしない", () => {
    useAgariScoreStore.getState().revealAnswer();

    expect(useAgariScoreStore.getState().isAnswered).toBe(false);
  });

  it("回答済みのときは何もしない（回答内容を消さない）", () => {
    seedQuestion();
    const answer: UserAnswer = { han: 1, fu: 30, score: 1000, yakus: [] };
    useAgariScoreStore.setState({ isAnswered: true, userAnswer: answer });

    useAgariScoreStore.getState().revealAnswer();

    expect(useAgariScoreStore.getState().userAnswer).toBe(answer);
  });
});

describe("useAgariScoreStore generationFailed", () => {
  beforeEach(() => {
    useAgariScoreStore.setState({
      currentQuestion: undefined,
      userAnswer: undefined,
      judgementResult: undefined,
      isAnswered: false,
      generationFailed: false,
      options: {
        includeFuro: true,
        includeChiitoi: false,
        allowedRanges: ["nonMangan", "manganPlus"],
      },
      stats: { total: 0, correct: 0 },
    });
  });

  it("生成が失敗すると generationFailed が立つ", () => {
    // minHan を満たす手は存在しないため、リトライを使い切って必ず失敗する
    useAgariScoreStore.getState().applyPracticeQuery("", { minHan: 100 });

    useAgariScoreStore.getState().generateNewQuestion();

    const state = useAgariScoreStore.getState();
    expect(state.currentQuestion).toBeUndefined();
    expect(state.generationFailed).toBe(true);
  });

  it("生成が成功すると generationFailed は下りる", () => {
    useAgariScoreStore.setState({ generationFailed: true });

    useAgariScoreStore.getState().generateNewQuestion();

    const state = useAgariScoreStore.getState();
    expect(state.currentQuestion).toBeDefined();
    expect(state.generationFailed).toBe(false);
  });

  it("setQuestion(undefined) は失敗扱いにしない（設定画面へ戻る前のクリア）", () => {
    useAgariScoreStore.setState({ generationFailed: true });

    useAgariScoreStore.getState().setQuestion(undefined);

    expect(useAgariScoreStore.getState().generationFailed).toBe(false);
  });
});

describe("useAgariScoreStore applyPracticeQuery", () => {
  beforeEach(() => {
    useAgariScoreStore.getState().setQuestion(undefined);
  });

  it("条件・成績・問題・適用済みクエリを 1 つの操作で入れ替える（生成はしない）", () => {
    seedQuestion();
    useAgariScoreStore.setState({
      stats: { total: 3, correct: 1 },
      generationFailed: true,
    });

    useAgariScoreStore
      .getState()
      .applyPracticeQuery("yaku=chiitoitsu", { requiredYaku: ["七対子"] });

    const state = useAgariScoreStore.getState();
    expect(state.appliedQuery).toBe("yaku=chiitoitsu");
    expect(state.options.requiredYaku).toEqual(["七対子"]);
    expect(state.options.includeFuro).toBe(true);
    expect(state.stats).toEqual({ total: 0, correct: 0 });
    expect(state.currentQuestion).toBeUndefined();
    expect(state.generationFailed).toBe(false);
  });

  it("「開始」のクリア（setQuestion(undefined)）で適用済みクエリも消える", () => {
    useAgariScoreStore.getState().applyPracticeQuery("", {});
    expect(useAgariScoreStore.getState().appliedQuery).toBe("");

    useAgariScoreStore.getState().setQuestion(undefined);
    expect(useAgariScoreStore.getState().appliedQuery).toBeUndefined();
  });
});
