import { render, cleanup, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let currentQuery = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentQuery),
  useRouter: () => ({ push: () => {} }),
}));
vi.mock("next-intl", async () => await import("@/test/intl-mock"));

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
