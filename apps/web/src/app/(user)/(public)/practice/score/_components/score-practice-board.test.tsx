import { render, cleanup, act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentQuery = "";

vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  useSearchParams: () => new URLSearchParams(currentQuery),
}));
vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock(
  "../../_actions/begin-practice-question",
  async () => await import("@/test/begin-practice-question-mock"),
);

const { beginPracticeQuestion } =
  await import("@/test/begin-practice-question-mock");
const { ScorePracticeBoard } = await import("./score-practice-board");
const { useScorePracticeStore } =
  await import("../_hooks/use-score-practice-store");

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
});
