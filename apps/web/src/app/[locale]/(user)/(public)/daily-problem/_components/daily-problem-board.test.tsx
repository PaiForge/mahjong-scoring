import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
// 牌を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";
import { eligibleAgariPayload } from "@/lib/daily-problem/test-payloads";
import { useAuth as mockUseAuth } from "@/test/auth-context-mock";

const { mockRecord, mockPeek } = vi.hoisted(() => ({
  mockRecord: vi.fn(),
  mockPeek: vi.fn(),
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// 面子分解（features の共有フック）は use-intl から辞書を読む
vi.mock("use-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("../_actions/record-daily-problem-answer", () => ({
  recordDailyProblemAnswerAction: mockRecord,
}));
vi.mock(
  "@/app/[locale]/(user)/(public)/practice/_actions/begin-practice-question",
  () => ({ peekPracticeQuota: mockPeek }),
);

const { DailyProblemBoard } = await import("./daily-problem-board");

const DAY = "2026-11-17";

const TARGETS = {
  practiceTarget: { href: "/practice/agari-score", crossLocale: false },
  homeTarget: { href: "/", crossLocale: false },
} as const;

async function show(initialAnswer?: { readonly isCorrect: boolean }) {
  const view = render(
    <DailyProblemBoard
      userId="alice"
      key={DAY}
      payload={eligibleAgariPayload()}
      day={DAY}
      initialAnswer={initialAnswer}
      {...TARGETS}
    />,
  );
  await screen.findByRole("button", { name: "revealButton" });
  return view;
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  mockRecord.mockResolvedValue({ success: true });
  mockPeek.mockResolvedValue({
    success: true,
    allowed: true,
    remaining: 3,
    limit: 5,
    signedIn: true,
    benefits: [],
  });
  useDisplaySettingsStore.setState({ scoreInput: "select" });
});

describe("DailyProblemBoard", () => {
  it("starts a fresh attempt when the day changes", async () => {
    const view = await show();
    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));
    await screen.findByText("save.saved");
    view.rerender(
      <DailyProblemBoard
        key="2026-11-18"
        day="2026-11-18"
        userId="alice"
        payload={eligibleAgariPayload()}
        {...TARGETS}
      />,
    );
    await screen.findByRole("button", { name: "revealButton" });
    expect(screen.queryByText("more.title")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));
    await waitFor(() =>
      expect(mockRecord).toHaveBeenLastCalledWith({
        day: "2026-11-18",
        isCorrect: false,
        userId: "alice",
      }),
    );
  });
  it("shows a reload action instead of retrying an expired answer", async () => {
    mockRecord.mockResolvedValue({ error: "staleDay" });
    await show();
    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));
    await screen.findByText("save.staleDay");
    expect(screen.getByRole("button", { name: "board.reload" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "save.retry" })).toBeNull();
  });
  it("最初は出題文と回答フォームを出し、記録も「もっと解く」もまだ出さない", async () => {
    await show();

    expect(screen.getByText("board.questionPrompt")).toBeTruthy();
    expect(screen.queryByText("more.title")).toBeNull();
    expect(screen.queryByText("board.answeredNotice")).toBeNull();
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("「わからない」は不正解として 1 回だけ記録し、答え合わせと「もっと解く」を出す", async () => {
    await show();

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    await waitFor(() => expect(mockRecord).toHaveBeenCalledTimes(1));
    expect(mockRecord).toHaveBeenCalledWith({
      day: DAY,
      isCorrect: false,
      userId: "alice",
    });
    expect(screen.getByText("result.headers.correct")).toBeTruthy();
    expect(screen.getByText("more.title")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "more.link" }).getAttribute("href"),
    ).toBe("/practice/agari-score");
    expect(
      screen.getByRole("link", { name: "more.home" }).getAttribute("href"),
    ).toBe("/");
    expect(mockPeek).toHaveBeenCalledWith("agari-score");
  });

  it("問題の報告のボタンは回答中は出さず、答え合わせを出してから出す", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "alice" }, isLoading: false });
    try {
      await show();
      // 辞書のモックはキーをそのまま返す（problemReport.button → "button"）
      expect(screen.queryByRole("button", { name: "button" })).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

      expect(
        await screen.findByRole("button", { name: "button" }),
      ).toBeTruthy();
    } finally {
      mockUseAuth.mockReset();
    }
  });

  it("解答済みなら上に注記を出し、同じ盤面をもう一度解ける", async () => {
    await show({ isCorrect: true });

    expect(screen.getByText("board.answeredNotice")).toBeTruthy();
    expect(screen.getByText("board.questionPrompt")).toBeTruthy();
  });

  it("記録の失敗は答え合わせを止めない", async () => {
    mockRecord.mockRejectedValue(new Error("offline"));
    await show();

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    expect(screen.getByText("result.headers.correct")).toBeTruthy();
    await screen.findByText("save.failed");
    mockRecord.mockResolvedValue({ success: true });
    fireEvent.click(screen.getByRole("button", { name: "save.retry" }));
    await screen.findByText("save.saved");
    expect(mockRecord.mock.calls.map(([value]) => value.isCorrect)).toEqual([
      false,
      false,
    ]);
  });
});
