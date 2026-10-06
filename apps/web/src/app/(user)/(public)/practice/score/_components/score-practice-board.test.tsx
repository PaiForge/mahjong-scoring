import { render, cleanup, act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentQuery = "";

vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  useSearchParams: () => new URLSearchParams(currentQuery),
}));
vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// 役の欄（YakuSelect）は features の共有フックが use-intl から辞書を読む
vi.mock("use-intl", async () => await import("@/test/intl-mock"));
vi.mock(
  "../../_actions/begin-practice-question",
  async () => await import("@/test/begin-practice-question-mock"),
);

const { beginPracticeQuestion, peekPracticeQuota } =
  await import("@/test/begin-practice-question-mock");
const { ScorePracticeBoard } = await import("./score-practice-board");
const { useScorePracticeStore } =
  await import("../_hooks/use-score-practice-store");
const { _resetPracticeQuota, usePracticeQuotaStore } =
  await import("../../_hooks/use-practice-quota");
const { SCORE_TOUR_ID } = await import("../_lib/tour-ids");

const LAST_FREE = {
  success: true,
  allowed: true,
  remaining: 0,
  limit: 5,
  signedIn: true,
  benefits: [],
} as const;

/** クエリを与えて盤面をマウントする（問題生成は effect 内なので act で包む） */
async function visit(query: string) {
  currentQuery = query;
  await act(async () => {
    render(<ScorePracticeBoard />);
  });
}

describe("ScorePracticeBoard", () => {
  beforeEach(() => {
    cleanup();
    beginPracticeQuestion.mockClear();
    peekPracticeQuota.mockClear();
    _resetPracticeQuota();
    useScorePracticeStore.getState().setQuestion(undefined);
  });

  it("無料枠を使い切っていれば問題を作らずペイウォールを出す", async () => {
    beginPracticeQuestion.mockResolvedValueOnce({
      success: true,
      allowed: false,
      remaining: 0,
      limit: 1,
      signedIn: false,
      benefits: [],
    });
    useScorePracticeStore.getState().setQuestion(undefined);

    await visit("");

    expect(useScorePracticeStore.getState().currentQuestion).toBeUndefined();
    expect(screen.getByText("perksTitle")).toBeDefined();
    // 未ログインは先にログインを勧め、料金ページは二の次
    expect(screen.getByRole("link", { name: "signInCta" })).toBeDefined();
    expect(screen.getByRole("link", { name: "planCta" })).toBeDefined();
  });

  it("問題を作る前に無料枠の消費を 1 回だけ聞く", async () => {
    await visit("ranges=non");
    expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
    expect(beginPracticeQuestion).toHaveBeenCalledWith("score");
  });

  it("クエリの出題条件をストアへ移してから問題を作る", async () => {
    await visit("yaku=chiitoitsu&ranges=non");

    const { options, currentQuestion } = useScorePracticeStore.getState();
    expect(options.requiredYaku).toEqual(["七対子"]);
    expect(options.allowedRanges).toEqual(["nonMangan"]);
    expect(currentQuestion).toBeDefined();
  });

  // ストアはモジュールスコープで、練習ページを離れても破棄されない。
  // 空に戻すのは設定画面の「開始」だけなので、教本のリンクから入り直す経路では
  // 必ず前回の問題が残った状態で再訪する
  it("前回の問題が残っていても、入り直せば新しい条件で作り直す", async () => {
    await visit("");
    const previous = useScorePracticeStore.getState().currentQuestion;
    expect(previous).toBeDefined();

    // 「開始」を経由せずに離脱して、教本から条件付きで入り直す
    cleanup();
    await visit("yaku=chiitoitsu&ranges=non");

    const { options, currentQuestion } = useScorePracticeStore.getState();
    expect(options.requiredYaku).toEqual(["七対子"]);
    expect(currentQuestion).not.toBe(previous);
  });

  // 生成はサーバーの許可を待ってから走る。返事が届くまでの間、前回の問題を
  // 新しい条件の盤面に出さない（遅い回線では前回の問題に答えられてしまう）
  it("入り直したら、サーバーの返事を待つ間も前回の問題を出さない", async () => {
    await visit("");
    expect(useScorePracticeStore.getState().currentQuestion).toBeDefined();

    let release: (() => void) | undefined;
    beginPracticeQuestion.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () =>
            resolve({
              success: true,
              allowed: true,
              remaining: "unlimited",
              limit: "unlimited",
              signedIn: true,
              benefits: [],
            });
        }),
    );
    cleanup();
    await visit("yaku=chiitoitsu&ranges=non");

    expect(useScorePracticeStore.getState().currentQuestion).toBeUndefined();
    expect(screen.queryByText("board.questionPrompt")).toBeNull();

    await act(async () => release?.());
    expect(useScorePracticeStore.getState().currentQuestion).toBeDefined();
  });

  // 同じ play のままクエリだけ変わる遷移（平和の練習 → 七対子の練習）。
  // コンポーネントは再マウントされないため、マウント一度きりの初期化では効かない
  it("マウントしたままクエリが変わっても条件を入れ替える", async () => {
    const { rerender } = render(<ScorePracticeBoard />);
    await act(async () => {
      currentQuery = "yaku=pinfu";
      rerender(<ScorePracticeBoard />);
    });
    expect(useScorePracticeStore.getState().options.requiredYaku).toEqual([
      "平和",
    ]);

    await act(async () => {
      currentQuery = "yaku=chiitoitsu";
      rerender(<ScorePracticeBoard />);
    });
    expect(useScorePracticeStore.getState().options.requiredYaku).toEqual([
      "七対子",
    ]);
  });

  it("入り直したら前回の練習の成績は持ち越さない", async () => {
    await visit("");
    act(() => {
      useScorePracticeStore.setState({ stats: { total: 7, correct: 5 } });
    });

    cleanup();
    await visit("yaku=chiitoitsu");

    expect(useScorePracticeStore.getState().stats).toEqual({
      total: 0,
      correct: 0,
    });
  });

  // 盤面を離れて戻ってきた経路（「制限なしで続けるには」で料金ページを見て
  // ブラウザバック等）。ストアに同じ条件の問題が残っているので、消費し直さず
  // 解答中の問題を続ける
  describe("同じ条件で戻ってきたとき", () => {
    it("消費し直さず、問題・成績・残数の表示を引き継ぐ", async () => {
      beginPracticeQuestion.mockResolvedValueOnce({
        ...LAST_FREE,
        remaining: 2,
      });
      await visit("ranges=non");
      const question = useScorePracticeStore.getState().currentQuestion;
      expect(question).toBeDefined();
      act(() => {
        useScorePracticeStore.setState({ stats: { total: 2, correct: 1 } });
      });
      peekPracticeQuota.mockResolvedValueOnce({ ...LAST_FREE, remaining: 2 });

      cleanup();
      await visit("ranges=non");

      expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
      const state = useScorePracticeStore.getState();
      expect(state.currentQuestion).toBe(question);
      expect(state.stats).toEqual({ total: 2, correct: 1 });
      expect(screen.getByText("board.questionPrompt")).toBeDefined();
      expect(screen.getByText("remaining")).toBeDefined();
    });

    it("最後の 1 問（残り 0）でも、戻ればその問題を続けられる", async () => {
      beginPracticeQuestion.mockResolvedValueOnce(LAST_FREE);
      await visit("");
      const question = useScorePracticeStore.getState().currentQuestion;

      cleanup();
      await visit("");

      expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
      expect(useScorePracticeStore.getState().currentQuestion).toBe(question);
      expect(screen.queryByText("perksTitle")).toBeNull();
    });

    it("残数と特典は消費しない問い合わせで取り直す", async () => {
      beginPracticeQuestion.mockResolvedValueOnce({
        ...LAST_FREE,
        remaining: 2,
      });
      await visit("");
      peekPracticeQuota.mockResolvedValueOnce({
        ...LAST_FREE,
        remaining: "unlimited",
        limit: "unlimited",
        benefits: ["unlimited_practice", "practice_tools"],
      });

      cleanup();
      await visit("");

      expect(peekPracticeQuota).toHaveBeenCalledWith("score");
      expect(usePracticeQuotaStore.getState().menus.score?.gate).toEqual({
        kind: "open",
        remaining: "unlimited",
        limit: "unlimited",
        benefits: ["unlimited_practice", "practice_tools"],
      });
      expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);
    });

    it("返事を待つ間に離れても、戻ったときに聞き直さず、届いた問題を続ける", async () => {
      let release: (() => void) | undefined;
      beginPracticeQuestion.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            release = () => resolve({ ...LAST_FREE, remaining: 2 });
          }),
      );
      await visit("");
      expect(useScorePracticeStore.getState().currentQuestion).toBeUndefined();

      cleanup();
      await visit("");
      expect(beginPracticeQuestion).toHaveBeenCalledTimes(1);

      await act(async () => release?.());
      expect(useScorePracticeStore.getState().currentQuestion).toBeDefined();
      expect(screen.getByText("board.questionPrompt")).toBeDefined();
    });

    it("上限で止まっていたら聞き直す（ペイウォールからログインして戻る経路）", async () => {
      beginPracticeQuestion.mockResolvedValueOnce({
        ...LAST_FREE,
        allowed: false,
        signedIn: false,
        limit: 1,
      });
      await visit("");
      expect(screen.getByText("perksTitle")).toBeDefined();

      cleanup();
      await visit("");

      expect(beginPracticeQuestion).toHaveBeenCalledTimes(2);
      expect(useScorePracticeStore.getState().currentQuestion).toBeDefined();
      expect(screen.queryByText("perksTitle")).toBeNull();
    });

    it("設定画面の「開始」を通れば、同じ条件でも新しい問題を作る", async () => {
      await visit("ranges=non");
      const previous = useScorePracticeStore.getState().currentQuestion;

      // 「開始」はストアを空に戻してから play へ遷移する（score-setup-form）
      cleanup();
      useScorePracticeStore.getState().setQuestion(undefined);
      await visit("ranges=non");

      expect(beginPracticeQuestion).toHaveBeenCalledTimes(2);
      expect(useScorePracticeStore.getState().currentQuestion).not.toBe(
        previous,
      );
    });
  });

  // 出題文の横の「?」が照らす要素。役の欄は設定で役の回答を求めるときだけ
  // 描かれ、ツアーは無いものを飛ばす（印が無いことで飛ばされる）
  describe("ヘルプツアー", () => {
    const tourTarget = (id: string) =>
      document.querySelector(`[data-tour-id="${id}"]`);

    it("回答中は「?」があり、盤面と各欄に印が付いている", async () => {
      await visit("");

      expect(screen.getByLabelText("label")).toBeDefined();
      for (const id of [
        SCORE_TOUR_ID.board,
        SCORE_TOUR_ID.han,
        SCORE_TOUR_ID.fu,
        SCORE_TOUR_ID.score,
        SCORE_TOUR_ID.submit,
        SCORE_TOUR_ID.reveal,
      ]) {
        expect(tourTarget(id), id).not.toBeNull();
      }
      expect(tourTarget(SCORE_TOUR_ID.yaku)).toBeNull();
    });

    it("役の回答を求める設定では役の欄にも印が付く", async () => {
      await visit("mode=with_yaku");

      expect(tourTarget(SCORE_TOUR_ID.yaku)).not.toBeNull();
    });

    it("答え合わせの段階では「?」を出さない", async () => {
      await visit("");
      act(() => {
        useScorePracticeStore.getState().revealAnswer();
      });

      expect(screen.queryByLabelText("label")).toBeNull();
    });
  });
});
