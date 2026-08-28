import { beforeEach, describe, expect, it } from "vitest";
import type { UserAnswer } from "@mahjong-scoring/core";
import { generateValidScoreQuestion } from "@mahjong-scoring/core";

import { useScorePracticeStore } from "../use-score-practice-store";

/** 各テストで出題済みの状態を作る（生成器は core の実物を使う） */
function seedQuestion() {
  const question = generateValidScoreQuestion({
    includeFuro: true,
    includeChiitoi: false,
    allowedRanges: ["nonMangan", "manganPlus"],
  });
  useScorePracticeStore.getState().setQuestion(question);
  return question;
}

describe("useScorePracticeStore revealAnswer", () => {
  beforeEach(() => {
    useScorePracticeStore.setState({
      currentQuestion: undefined,
      userAnswer: undefined,
      judgementResult: undefined,
      isAnswered: false,
      stats: { total: 0, correct: 0 },
    });
  });

  it("無回答のまま開示状態にし、統計は変えない", () => {
    seedQuestion();

    useScorePracticeStore.getState().revealAnswer();

    const state = useScorePracticeStore.getState();
    expect(state.isAnswered).toBe(true);
    expect(state.userAnswer).toBeUndefined();
    expect(state.judgementResult).toBeUndefined();
    expect(state.stats).toEqual({ total: 0, correct: 0 });
  });

  it("問題が無いときは何もしない", () => {
    useScorePracticeStore.getState().revealAnswer();

    expect(useScorePracticeStore.getState().isAnswered).toBe(false);
  });

  it("回答済みのときは何もしない（回答内容を消さない）", () => {
    seedQuestion();
    const answer: UserAnswer = { han: 1, fu: 30, score: 1000, yakus: [] };
    useScorePracticeStore.setState({ isAnswered: true, userAnswer: answer });

    useScorePracticeStore.getState().revealAnswer();

    expect(useScorePracticeStore.getState().userAnswer).toBe(answer);
  });
});

describe("useScorePracticeStore generationFailed", () => {
  beforeEach(() => {
    useScorePracticeStore.setState({
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
    useScorePracticeStore.getState().setOptions({ minHan: 100 });

    useScorePracticeStore.getState().generateNewQuestion();

    const state = useScorePracticeStore.getState();
    expect(state.currentQuestion).toBeUndefined();
    expect(state.generationFailed).toBe(true);
  });

  it("生成が成功すると generationFailed は下りる", () => {
    useScorePracticeStore.setState({ generationFailed: true });

    useScorePracticeStore.getState().generateNewQuestion();

    const state = useScorePracticeStore.getState();
    expect(state.currentQuestion).toBeDefined();
    expect(state.generationFailed).toBe(false);
  });

  it("setQuestion(undefined) は失敗扱いにしない（設定画面へ戻る前のクリア）", () => {
    useScorePracticeStore.setState({ generationFailed: true });

    useScorePracticeStore.getState().setQuestion(undefined);

    expect(useScorePracticeStore.getState().generationFailed).toBe(false);
  });
});
