import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCompleteLesson } = vi.hoisted(() => ({
  mockCompleteLesson: vi.fn(),
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("../_actions/complete-lesson", () => ({
  completeLesson: mockCompleteLesson,
}));

const { useAuth: mockUseAuth } = await import("@/test/auth-context-mock");
const { LessonView } = await import("./lesson-view");

function renderLesson() {
  return render(
    <LessonView
      slug="mangan-ko-ron"
      chapterSlug="mangan-ko-ron"
      explanation={<p data-testid="explanation" />}
    />,
  );
}

function startQuiz() {
  fireEvent.click(screen.getByRole("button", { name: "startQuiz" }));
}

/** 選択肢ボタン（点数の表示文字列で引く） */
function choice(points: string) {
  return screen.getByRole("button", { name: points });
}

/** 3 問すべてに答えて完了画面まで進める */
function answerAll(answers: readonly string[]) {
  for (const [i, points] of answers.entries()) {
    fireEvent.click(choice(points));
    fireEvent.click(
      screen.getByRole("button", {
        name: i === answers.length - 1 ? "finish" : "next",
      }),
    );
  }
}

describe("LessonView", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockCompleteLesson.mockResolvedValue({ success: true });
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
  });

  it("最初は説明を出し、確認問題はまだ出さない", () => {
    renderLesson();

    expect(screen.getByTestId("explanation")).toBeTruthy();
    expect(screen.queryByTestId("lesson-condition")).toBeNull();
  });

  it("確認問題は 5 つの点数から選び、正解すると正解の表示と次へのボタンが出る", () => {
    renderLesson();
    startQuiz();

    expect(screen.getByText("progress")).toBeTruthy();
    for (const points of ["8,000", "12,000", "16,000", "24,000", "32,000"]) {
      expect(choice(points)).toBeTruthy();
    }

    fireEvent.click(choice("8,000"));

    expect(screen.getByTestId("lesson-judgement").textContent).toContain(
      "correct",
    );
    expect(screen.getByRole("button", { name: "next" })).toBeTruthy();
    // 回答後は選択肢を押せない
    expect((choice("12,000") as HTMLButtonElement).disabled).toBe(true);
  });

  it("不正解でも止まらず、正解と解説を見せて次へ進める", () => {
    renderLesson();
    startQuiz();

    fireEvent.click(choice("32,000"));

    expect(screen.getByTestId("lesson-judgement").textContent).toContain(
      "incorrect",
    );
    expect(screen.getByText("questions.mangan.explanation")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    // 2 問目に進んでいる（判定は消え、選択肢が再び押せる）
    expect(screen.queryByTestId("lesson-judgement")).toBeNull();
    expect((choice("12,000") as HTMLButtonElement).disabled).toBe(false);
  });

  it("ヒントは回答前にだけ出せる", () => {
    renderLesson();
    startQuiz();

    expect(screen.queryByTestId("lesson-hint")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "showHint" }));
    expect(screen.getByTestId("lesson-hint").textContent).toContain(
      "questions.mangan.hint",
    );

    fireEvent.click(choice("8,000"));
    expect(screen.queryByTestId("lesson-hint")).toBeNull();
  });

  it("3 問解くとできたことを出し、未ログインなら登録への誘導と章へのリンクを出す", () => {
    renderLesson();
    startQuiz();
    answerAll(["8,000", "12,000", "32,000"]);

    expect(screen.getByText("achievement")).toBeTruthy();
    expect(screen.getByTestId("lesson-score").textContent).toBe("doneScore");
    expect(
      screen.getByRole("link", { name: "signUp.cta" }).getAttribute("href"),
    ).toBe("/sign-up");
    expect(
      screen
        .getByRole("link", { name: "signUp.secondary" })
        .getAttribute("href"),
    ).toBe("/learn/mangan-ko-ron");
    // 未ログインでは完了を記録しに行かない
    expect(mockCompleteLesson).not.toHaveBeenCalled();
  });

  it("ログイン済みなら完了を 1 回だけ記録し、ホームへの導線を出す", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    renderLesson();
    startQuiz();
    answerAll(["8,000", "12,000", "16,000"]);

    expect(screen.getByTestId("lesson-score").textContent).toBe(
      "doneScorePerfect",
    );
    expect(
      screen.getByRole("link", { name: "continueHome" }).getAttribute("href"),
    ).toBe("/");
    expect(mockCompleteLesson).toHaveBeenCalledTimes(1);
    expect(mockCompleteLesson).toHaveBeenCalledWith("mangan-ko-ron");

    // やり直して再び解き終えても二重には記録しない
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    startQuiz();
    answerAll(["8,000", "12,000", "16,000"]);
    expect(mockCompleteLesson).toHaveBeenCalledTimes(1);
  });
});
