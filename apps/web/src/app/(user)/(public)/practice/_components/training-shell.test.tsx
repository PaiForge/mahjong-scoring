import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

// チャレンジ導線が出題条件のクエリを引き継ぐため、シェルは検索パラメータを読む
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
      exitHref="/practice/score-table"
      challengeHref="/practice/score-table/play"
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
});

describe("TrainingShell 終了", () => {
  it("終了リンクを押すとチャレンジと同じく終了トーストを預ける", () => {
    renderShell();

    fireEvent.click(screen.getByRole("link", { name: "exitButton" }));
    // その場では出さず、遷移先の説明ページに着いてから出す
    expect(takeToastOnArrival("/practice/score-table")?.message).toBe(
      "exitToast",
    );
  });
});

describe("TrainingShell チャレンジ導線", () => {
  it("末尾にチャレンジへのボタンを出す", () => {
    currentQuery = "";
    renderShell();

    const cta = screen.getByRole("link", { name: /challengeButton/ });
    expect(cta.getAttribute("href")).toBe("/practice/score-table/play");
  });

  it("出題条件のクエリを付けたままチャレンジへ渡す", () => {
    // 絞った条件で練習していた人が、全条件のチャレンジに着地しないこと
    currentQuery = "roles=ko&wins=ron";
    renderShell();

    const cta = screen.getByRole("link", { name: /challengeButton/ });
    expect(cta.getAttribute("href")).toBe(
      "/practice/score-table/play?roles=ko&wins=ron",
    );
  });
});

describe("TrainingShell 模試（昇級試験のトレーニング）", () => {
  function renderExamShell() {
    return renderShell({
      slug: "mangan-exam",
      variant: "exam",
      exitHref: "/exam/mangan",
      challengeHref: "/exam/mangan/play",
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
