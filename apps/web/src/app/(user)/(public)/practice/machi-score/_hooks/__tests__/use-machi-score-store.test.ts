import { beforeEach, describe, expect, it } from "vitest";
import type {
  MachiCellJudgementMode,
  ScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";
import {
  generateValidMachiScoreQuestion,
  machiCellKey,
} from "@mahjong-scoring/core";

import { listCellRefs, useMachiScoreStore } from "../use-machi-score-store";

const MODE: MachiCellJudgementMode = {
  requireYaku: false,
  simplifyMangan: false,
  requireFuForMangan: false,
  allowDoubleYakuman: false,
};

/** 出題の正解からそのまま作った回答 */
function correctAnswerOf(cell: ScoreQuestion): UserAnswer {
  const { payment } = cell.answer;
  const base = { han: cell.answer.han, fu: cell.answer.fu, yakus: [] };
  return payment.type === "koTsumo"
    ? {
        ...base,
        scoreFromKo: payment.amount[0],
        scoreFromOya: payment.amount[1],
      }
    : { ...base, score: payment.amount };
}

/** 各テストで出題済みの状態を作る（生成器は core の実物を使う） */
function seedQuestion() {
  const question = generateValidMachiScoreQuestion();
  if (!question) throw new Error("問題を生成できなかった");
  useMachiScoreStore.getState().setQuestion(question);
  return question;
}

/** 待ちを正解して点数の回答へ進む */
function answerMachiCorrectly() {
  const question = seedQuestion();
  const store = useMachiScoreStore.getState();
  for (const wait of question.waits) store.toggleMachi(wait.agariHai);
  useMachiScoreStore.getState().submitMachi();
  useMachiScoreStore.getState().proceedToCells();
  return question;
}

describe("useMachiScoreStore", () => {
  beforeEach(() => {
    useMachiScoreStore.getState().setQuestion(undefined);
    useMachiScoreStore.getState().resetStats();
  });

  it("待ちを回答すると判定が付き、進むまで段階は変わらない", () => {
    const question = seedQuestion();
    const store = useMachiScoreStore.getState();
    store.toggleMachi(question.waits[0].agariHai);
    useMachiScoreStore.getState().submitMachi();

    const state = useMachiScoreStore.getState();
    expect(state.phase).toBe("machi");
    expect(state.machiJudgement).toBeDefined();
    // 判定後は選択を変えられない
    state.toggleMachi(question.waits[1].agariHai);
    expect(useMachiScoreStore.getState().selectedMachi).toEqual([
      question.waits[0].agariHai,
    ]);

    useMachiScoreStore.getState().proceedToCells();
    expect(useMachiScoreStore.getState().phase).toBe("cells");
  });

  it("マスの選択は同じ列（ツモ / ロン）に限る", () => {
    const question = answerMachiCorrectly();
    const [first, second] = question.waits;
    const store = useMachiScoreStore.getState();

    store.toggleCell({ agariHai: first.agariHai, isTsumo: true });
    useMachiScoreStore
      .getState()
      .toggleCell({ agariHai: second.agariHai, isTsumo: true });
    expect(useMachiScoreStore.getState().selectedCells).toHaveLength(2);

    // 別の列を押すと選択がそちらへ移る
    useMachiScoreStore
      .getState()
      .toggleCell({ agariHai: first.agariHai, isTsumo: false });
    expect(useMachiScoreStore.getState().selectedCells).toEqual([
      { agariHai: first.agariHai, isTsumo: false },
    ]);
  });

  it("1 つの回答を選択中のマスすべてに当てはめ、回答済みのマスを押しても回答は残り、当てはめ直すと置き換わる", () => {
    const question = answerMachiCorrectly();
    for (const wait of question.waits) {
      useMachiScoreStore
        .getState()
        .toggleCell({ agariHai: wait.agariHai, isTsumo: true });
    }
    const answer: UserAnswer = { han: 1, fu: 30, score: 1000, yakus: [] };
    useMachiScoreStore.getState().assignAnswer({ kind: "score", answer });

    let state = useMachiScoreStore.getState();
    expect(state.selectedCells).toEqual([]);
    for (const wait of question.waits) {
      expect(state.cellAnswers[machiCellKey(wait.agariHai, true)]).toEqual({
        kind: "score",
        answer,
      });
    }

    // 回答済みを押す → 選択に入るだけで回答はそのまま（誤タップで消えない）
    const cell = { agariHai: question.waits[0].agariHai, isTsumo: true };
    state.toggleCell(cell);
    state = useMachiScoreStore.getState();
    expect(state.cellAnswers[machiCellKey(cell.agariHai, true)]).toEqual({
      kind: "score",
      answer,
    });
    expect(state.selectedCells).toEqual([cell]);

    // もう一度押すと選択が外れ、回答は変わらない
    state.toggleCell(cell);
    state = useMachiScoreStore.getState();
    expect(state.selectedCells).toEqual([]);
    expect(state.cellAnswers[machiCellKey(cell.agariHai, true)]).toEqual({
      kind: "score",
      answer,
    });

    // 選び直して当てはめると置き換わる
    const replaced: UserAnswer = { han: 2, fu: 40, score: 2600, yakus: [] };
    state.toggleCell(cell);
    useMachiScoreStore
      .getState()
      .assignAnswer({ kind: "score", answer: replaced });
    state = useMachiScoreStore.getState();
    expect(state.cellAnswers[machiCellKey(cell.agariHai, true)]).toEqual({
      kind: "score",
      answer: replaced,
    });
    expect(state.selectedCells).toEqual([]);
  });

  it("待ちも全マスも正解なら正解として数える", () => {
    const question = answerMachiCorrectly();
    for (const cell of listCellRefs(question)) {
      const wait = question.waits.find((w) => w.agariHai === cell.agariHai);
      if (!wait) throw new Error("待ちが無い");
      const cellQuestion = cell.isTsumo ? wait.tsumo : wait.ron;
      useMachiScoreStore.getState().toggleCell(cell);
      useMachiScoreStore
        .getState()
        .assignAnswer(
          cellQuestion
            ? { kind: "score", answer: correctAnswerOf(cellQuestion) }
            : { kind: "noYaku" },
        );
    }
    useMachiScoreStore.getState().submitCells(MODE);

    const state = useMachiScoreStore.getState();
    expect(state.phase).toBe("result");
    expect(state.isAllCorrect).toBe(true);
    expect(state.stats).toEqual({ total: 1, correct: 1 });
    expect(Object.keys(state.cellResults ?? {})).toHaveLength(
      question.waits.length * 2,
    );
  });

  it("待ちを外していれば、全マス正解でも不正解として数える", () => {
    const question = seedQuestion();
    useMachiScoreStore.getState().toggleMachi(question.waits[0].agariHai);
    useMachiScoreStore.getState().submitMachi();
    useMachiScoreStore.getState().proceedToCells();
    for (const cell of listCellRefs(question)) {
      const wait = question.waits.find((w) => w.agariHai === cell.agariHai);
      if (!wait) throw new Error("待ちが無い");
      const cellQuestion = cell.isTsumo ? wait.tsumo : wait.ron;
      useMachiScoreStore.getState().toggleCell(cell);
      useMachiScoreStore
        .getState()
        .assignAnswer(
          cellQuestion
            ? { kind: "score", answer: correctAnswerOf(cellQuestion) }
            : { kind: "noYaku" },
        );
    }
    useMachiScoreStore.getState().submitCells(MODE);

    const state = useMachiScoreStore.getState();
    expect(state.isAllCorrect).toBe(false);
    expect(state.stats).toEqual({ total: 1, correct: 0 });
  });

  it("「わからない」は無回答のまま答え合わせへ進み、統計は変えない", () => {
    seedQuestion();
    useMachiScoreStore.getState().revealAnswer();

    const state = useMachiScoreStore.getState();
    expect(state.phase).toBe("result");
    expect(state.cellResults).toBeUndefined();
    expect(state.machiJudgement).toBeUndefined();
    expect(state.stats).toEqual({ total: 0, correct: 0 });
  });

  it("次の問題へ進むと入力はすべて初期化される", () => {
    const question = answerMachiCorrectly();
    useMachiScoreStore
      .getState()
      .toggleCell({ agariHai: question.waits[0].agariHai, isTsumo: false });
    useMachiScoreStore.getState().assignAnswer({ kind: "noYaku" });
    useMachiScoreStore.getState().nextQuestion();

    const state = useMachiScoreStore.getState();
    expect(state.currentQuestion).not.toBe(question);
    expect(state.phase).toBe("machi");
    expect(state.selectedMachi).toEqual([]);
    expect(state.machiJudgement).toBeUndefined();
    expect(state.cellAnswers).toEqual({});
    expect(state.cellResults).toBeUndefined();
  });

  it("setQuestion(undefined) は失敗扱いにしない（設定画面へ戻る前のクリア）", () => {
    useMachiScoreStore.setState({ generationFailed: true });
    useMachiScoreStore.getState().setQuestion(undefined);
    expect(useMachiScoreStore.getState().generationFailed).toBe(false);
  });
});
