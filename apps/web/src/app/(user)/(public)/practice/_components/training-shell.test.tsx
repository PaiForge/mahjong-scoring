import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

// 「終了」とチャレンジ導線が出題設定（バリアント）を引き継ぐため、シェルは
// 検索パラメータを読む
let currentQuery = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentQuery),
}));

// 模試の末尾は本番の受験ゲート（認証と段級位を読む）になる
const { mockUseAuth, mockFetchViewerRankSlugs } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockFetchViewerRankSlugs: vi.fn(),
}));
vi.mock("@/app/_contexts/auth-context", () => ({ useAuth: mockUseAuth }));
vi.mock("@/app/_lib/viewer-ranks", () => ({
  fetchViewerRankSlugs: mockFetchViewerRankSlugs,
}));

import { takeToastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { TrainingShell } from "./training-shell";

function renderShell(props: Partial<Parameters<typeof TrainingShell>[0]> = {}) {
  return render(
    <TrainingShell
      title="t"
      slug="score-table"
      correctCount={0}
      totalCount={0}
      challengeRules={{ timeLimit: 60, mistakeLimit: 3 }}
      {...props}
    >
      <div>body</div>
    </TrainingShell>,
  );
}

describe("TrainingShell わからない（正解開示）", () => {
  it("onReveal 指定時は「わからない」リンクを表示し、クリックで呼ぶ", () => {
    const onReveal = vi.fn();
    renderShell({ onReveal });
    const reveal = screen.getByRole("button", { name: "revealButton" });
    fireEvent.click(reveal);
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it("onReveal 未指定時は「わからない」を表示しない", () => {
    renderShell();
    expect(screen.queryByRole("button", { name: "revealButton" })).toBeNull();
  });

  it("revealDisabled 時は「わからない」を無効化する", () => {
    const onReveal = vi.fn();
    renderShell({ onReveal, revealDisabled: true });
    const reveal = screen.getByRole("button", { name: "revealButton" });
    expect((reveal as HTMLButtonElement).disabled).toBe(true);
  });

  it("開示中は同じ位置に「次の問題へ」を出し、クリックで onProceed を呼ぶ", () => {
    const onReveal = vi.fn();
    const onProceed = vi.fn();
    renderShell({ onReveal, isRevealed: true, onProceed });

    expect(screen.queryByRole("button", { name: "revealButton" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));
    expect(onProceed).toHaveBeenCalledTimes(1);
    expect(onReveal).not.toHaveBeenCalled();
  });
});

describe("TrainingShell 回答後の停止", () => {
  it("停止中は盤面の直下に「次の問題へ」を出し、クリックで onProceed を呼ぶ", () => {
    const onProceed = vi.fn();
    renderShell({ isHolding: true, onProceed });

    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("停止していないときは「次の問題へ」を出さない", () => {
    renderShell({ onProceed: vi.fn() });

    expect(screen.queryByRole("button", { name: "nextButton" })).toBeNull();
  });

  it("回答ボタンを持たない盤面では、停止していない間も不可視のボタンで場所を取る", () => {
    // 現れた瞬間にカウンタ以下が押し下げられないため。
    // 支援技術と Tab には見せない（inert / aria-hidden）
    renderShell({ onProceed: vi.fn() });

    const reserved = screen.getByRole("button", {
      name: "nextButton",
      hidden: true,
    });
    expect(reserved.parentElement?.className).toContain("invisible");
    expect(reserved.parentElement?.hasAttribute("inert")).toBe(true);
  });

  it("回答ボタンを持つ盤面では場所を取らない（回答ボタンと入れ替わる）", () => {
    renderShell({ onProceed: vi.fn(), hasSubmitButton: true });

    expect(
      screen.queryByRole("button", { name: "nextButton", hidden: true }),
    ).toBeNull();
  });

  it("回答ボタンを持つ盤面でも停止中は「次の問題へ」を出す", () => {
    const onProceed = vi.fn();
    renderShell({ isHolding: true, onProceed, hasSubmitButton: true });

    fireEvent.click(screen.getByRole("button", { name: "nextButton" }));
    expect(onProceed).toHaveBeenCalledTimes(1);
  });
});

describe("TrainingShell 終了", () => {
  it("終了リンクを押すとチャレンジと同じく終了トーストを預ける", () => {
    currentQuery = "";
    renderShell();

    fireEvent.click(screen.getByRole("link", { name: "exitButton" }));
    // その場では出さず、遷移先の説明ページに着いてから出す
    expect(takeToastOnArrival("/practice/score-table")?.message).toBe(
      "exitToast",
    );
  });

  it("今の出題設定を持って説明ページへ戻る", () => {
    // 説明ページの選択パネルは URL のバリアントを初期選択にする。
    // 落とすと、終了した瞬間に選んでいた設定が既定に戻る
    currentQuery = "variant=oya_mangan_plus";
    renderShell();

    const exit = screen.getByRole("link", { name: "exitButton" });
    expect(exit.getAttribute("href")).toBe(
      "/practice/score-table?variant=oya_mangan_plus",
    );
  });

  it("設定が未指定なら既定の設定を明示して説明ページへ戻る", () => {
    // 盤面は既定で出題していたので、戻った先の初期選択もそれに揃える
    currentQuery = "";
    renderShell();

    const exit = screen.getByRole("link", { name: "exitButton" });
    expect(exit.getAttribute("href")).toBe(
      "/practice/score-table?variant=ko_mangan_plus",
    );
  });
});

describe("TrainingShell チャレンジ導線", () => {
  it("末尾にチャレンジへのボタンを出す（設定が未指定なら既定の設定）", () => {
    currentQuery = "";
    renderShell();

    const cta = screen.getByRole("link", { name: /challengeButton/ });
    expect(cta.getAttribute("href")).toBe(
      "/practice/score-table/play?variant=ko_mangan_plus",
    );
  });

  it("今の出題設定を付けたままチャレンジへ渡す", () => {
    // 絞った設定で練習していた人が、既定の設定のチャレンジに着地しないこと。
    // クエリを継ぎ足すのではなくパスを組み直す（既定が付いたパスに二重に
    // 付くと `?variant=a?variant=b` の不正値になり、既定に落ちていた）
    currentQuery = "variant=oya_mangan_plus";
    renderShell();

    const cta = screen.getByRole("link", { name: /challengeButton/ });
    expect(cta.getAttribute("href")).toBe(
      "/practice/score-table/play?variant=oya_mangan_plus",
    );
  });

  it("不正な設定は既定に正規化して渡す", () => {
    currentQuery = "variant=bogus";
    renderShell();

    const cta = screen.getByRole("link", { name: /challengeButton/ });
    expect(cta.getAttribute("href")).toBe(
      "/practice/score-table/play?variant=ko_mangan_plus",
    );
  });
});

describe("TrainingShell 模試（昇級試験のトレーニング）", () => {
  function renderExamShell() {
    return renderShell({
      slug: "mangan-exam",
      variant: "exam",
      challengeRules: { timeLimit: 60, mistakeLimit: 1 },
    });
  }

  it("末尾の導線は「チャレンジ」ではなく本番の試験を指す", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, isLoading: false });
    mockFetchViewerRankSlugs.mockResolvedValue([]);
    renderExamShell();

    expect(screen.getByText("modeActive")).toBeTruthy();
    expect(screen.getByText("realExamPrompt")).toBeTruthy();
    const cta = await screen.findByRole("link", { name: /realExamButton/ });
    expect(cta.getAttribute("href")).toBe("/exam/mangan/play");
    expect(screen.queryByRole("link", { name: /challengeButton/ })).toBeNull();
  });

  it("未ログインなら本番のボタンではなく登録の導線を出す", async () => {
    // 押した先でサーバーに説明ページへ戻される緑のボタンを出さない
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
    renderExamShell();

    expect(await screen.findByText("examGate.signUpButton")).toBeTruthy();
    expect(document.querySelector('a[href="/exam/mangan/play"]')).toBeNull();
  });

  it("終了トーストは模試の文言で預ける", () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
    renderExamShell();

    fireEvent.click(screen.getByRole("link", { name: "exitButton" }));
    expect(takeToastOnArrival("/exam/mangan")?.message).toBe("exitToast");
  });
});
