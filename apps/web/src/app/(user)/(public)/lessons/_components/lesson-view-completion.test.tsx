import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetState, mockCompleteLesson } = vi.hoisted(() => ({
  mockGetState: vi.fn(),
  mockCompleteLesson: vi.fn(),
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("../_actions/get-lesson-completion-state", () => ({
  getLessonCompletionState: mockGetState,
}));
vi.mock("../_actions/complete-lesson", () => ({
  completeLesson: mockCompleteLesson,
}));

const { useAuth: mockUseAuth } = await import("@/test/auth-context-mock");
const { LessonView } = await import("./lesson-view");

function renderPage(goal?: ReactNode) {
  return render(
    <LessonView
      slug="mangan-ko-ron"
      messageKey="manganKoRon"
      chapterSlug="mangan-ko-ron"
      next={{ href: "/lessons/mangan-ko-tsumo", label: "nextLesson", goal }}
      explanation={<p data-testid="explanation" />}
      related={<p data-testid="related" />}
    />,
  );
}

/** ブラウザの戻るを押し、popstate が届いて描き直されるまで待つ */
async function traverse(direction: "back" | "forward") {
  await act(async () => {
    const popped = new Promise((resolve) =>
      window.addEventListener("popstate", resolve, { once: true }),
    );
    window.history[direction]();
    await popped;
  });
}

/** 取得の Server Action が解決するまで待つ */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("LessonView の済みの印", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
    mockCompleteLesson.mockResolvedValue({ success: true });
  });

  it("完了済みのレッスンには説明の画面で済みの印を出し、確認問題では出さない", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetState.mockResolvedValue(true);
    renderPage();

    expect(
      await screen.findByRole("img", { name: "completedMark" }),
    ).toBeTruthy();
    expect(mockGetState).toHaveBeenCalledWith("mangan-ko-ron");

    // 同じ位置に進み具合が出るので重ねない
    fireEvent.click(screen.getByRole("button", { name: "retakeQuiz" }));
    expect(screen.queryByRole("img", { name: "completedMark" })).toBeNull();
  });

  it("完了済みなら確認問題のボタンを解き直しのリンクに替え、練習・教本を出す", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetState.mockResolvedValue(true);
    renderPage();

    expect(
      await screen.findByRole("button", { name: "retakeQuiz" }),
    ).toBeTruthy();
    // 次のレッスンへの導線は出さない（道筋の続きはホームが示す）
    expect(screen.queryByRole("link", { name: "nextLesson" })).toBeNull();
    expect(screen.getByTestId("explanation")).toBeTruthy();
    expect(screen.getByTestId("related")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "startQuiz" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "retakeQuiz" }));
    expect(screen.getByTestId("lesson-condition")).toBeTruthy();
  });

  it("完了済みと分かるまでは確認問題へのボタンを出す", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetState.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByRole("button", { name: "startQuiz" })).toBeTruthy();
    expect(screen.queryByTestId("related")).toBeNull();
  });

  it("未完了なら出さない", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetState.mockResolvedValue(false);
    renderPage();
    await flush();

    expect(screen.queryByRole("img", { name: "completedMark" })).toBeNull();
  });

  it("未ログインなら完了を問い合わせず、出さない", async () => {
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
    renderPage();
    await flush();

    expect(mockGetState).not.toHaveBeenCalled();
    expect(screen.queryByRole("img", { name: "completedMark" })).toBeNull();
  });

  it("その場で解き終えて記録できたら、説明に戻ったときに印が付いている", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetState.mockResolvedValue(false);
    renderPage();
    await flush();

    fireEvent.click(screen.getByRole("button", { name: "startQuiz" }));
    for (const [i, points] of ["8,000", "12,000", "16,000"].entries()) {
      fireEvent.click(screen.getByRole("button", { name: points }));
      fireEvent.click(
        screen.getByRole("button", { name: i === 2 ? "finish" : "next" }),
      );
    }

    await screen.findByRole("link", { name: "nextLesson" });
    // 完了画面は達成の表示があるので印は出さない
    expect(screen.queryByRole("img", { name: "completedMark" })).toBeNull();

    await traverse("back");
    await traverse("back");
    expect(screen.getByRole("img", { name: "completedMark" })).toBeTruthy();
    expect(mockGetState).toHaveBeenCalledTimes(1);
  });

  it("昇級試験までのパネルを渡されたら、次の一歩のボタンの下に添える", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetState.mockResolvedValue(false);
    renderPage(<p data-testid="goal" />);
    await flush();

    fireEvent.click(screen.getByRole("button", { name: "startQuiz" }));
    for (const [i, points] of ["8,000", "12,000", "16,000"].entries()) {
      fireEvent.click(screen.getByRole("button", { name: points }));
      fireEvent.click(
        screen.getByRole("button", { name: i === 2 ? "finish" : "next" }),
      );
    }

    const button = await screen.findByRole("link", { name: "nextLesson" });
    const goal = screen.getByTestId("goal");
    expect(
      button.compareDocumentPosition(goal) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
