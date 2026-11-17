import { cleanup, fireEvent, screen } from "@testing-library/react";
// 牌を描くので TileImageProvider で包む render を使う
import { render } from "@/test/tile-image-render";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDisplaySettingsStore } from "@/app/_hooks/use-display-settings-store";
import { eligibleAgariPayload } from "@/lib/daily-problem/test-payloads";

const { mockRecord, mockPeek } = vi.hoisted(() => ({
  mockRecord: vi.fn(),
  mockPeek: vi.fn(),
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
// 面子分解（features の共有フック）は use-intl から辞書を読む
vi.mock("use-intl", async () => await import("@/test/intl-mock"));
vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));
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

function show(initialAnswer?: { readonly isCorrect: boolean }) {
  return render(
    <DailyProblemBoard
      payload={eligibleAgariPayload()}
      day={DAY}
      initialAnswer={initialAnswer}
      {...TARGETS}
    />,
  );
}

beforeEach(() => {
  cleanup();
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
  it("最初は出題文と回答フォームを出し、記録も「もっと解く」もまだ出さない", () => {
    show();

    expect(screen.getByText("board.questionPrompt")).toBeTruthy();
    expect(screen.queryByText("more.title")).toBeNull();
    expect(screen.queryByText("board.answeredNotice")).toBeNull();
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("「わからない」は不正解として 1 回だけ記録し、答え合わせと「もっと解く」を出す", () => {
    show();

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledWith({ day: DAY, isCorrect: false });
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

  it("解答済みなら上に注記を出し、同じ盤面をもう一度解ける", () => {
    show({ isCorrect: true });

    expect(screen.getByText("board.answeredNotice")).toBeTruthy();
    expect(screen.getByText("board.questionPrompt")).toBeTruthy();
  });

  it("記録の失敗は答え合わせを止めない", () => {
    mockRecord.mockRejectedValue(new Error("offline"));
    show();

    fireEvent.click(screen.getByRole("button", { name: "revealButton" }));

    expect(screen.getByText("result.headers.correct")).toBeTruthy();
  });
});
