import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LESSON_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";

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
// 済みの印が使う。進行のテストでは常に未完了（印の表示は
// lesson-view-completion.test.tsx が見る）
vi.mock("../_actions/get-lesson-completion-state", () => ({
  getLessonCompletionState: vi.fn(async () => false),
}));

const { useAuth: mockUseAuth } = await import("@/test/auth-context-mock");
const { readPendingLessonCompletions } =
  await import("../_lib/pending-completions-storage");
const { LessonView } = await import("./lesson-view");

/** ページと同じく、本文のアンカー（ContentContainer の id）の中に描く */
function renderLesson() {
  return render(
    <div id={LESSON_SCROLL_ANCHOR_ID}>
      <LessonView
        slug="mangan-ko-ron"
        messageKey="manganKoRon"
        chapterSlug="mangan-ko-ron"
        next={{ href: "/lessons/mangan-ko-tsumo", label: "nextLesson" }}
        explanation={<p data-testid="explanation" />}
        related={<p data-testid="related" />}
      />
    </div>,
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

/** 解決を外から制御できる Promise */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** ブラウザの戻る / 進むを押し、popstate が届いて描き直されるまで待つ */
async function traverse(direction: "back" | "forward") {
  await act(async () => {
    const popped = new Promise((resolve) =>
      window.addEventListener("popstate", resolve, { once: true }),
    );
    window.history[direction]();
    await popped;
  });
}

const signedIn = { user: { id: "u1" }, isLoading: false };

describe("LessonView", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
    mockCompleteLesson.mockResolvedValue({ success: true });
    mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
  });

  it("最初は説明を出し、確認問題はまだ出さない", () => {
    renderLesson();

    expect(screen.getByTestId("explanation")).toBeTruthy();
    expect(screen.queryByTestId("lesson-condition")).toBeNull();
  });

  it("練習・教本への導線は解き終えるまで出さない", async () => {
    renderLesson();
    expect(screen.queryByTestId("related")).toBeNull();
    startQuiz();
    expect(screen.queryByTestId("related")).toBeNull();

    answerAll(["8,000", "12,000", "32,000"]);

    expect(await screen.findByTestId("related")).toBeTruthy();
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

  describe("未ログイン（サーバーが skipped: anonymous を返す）", () => {
    beforeEach(() => {
      mockCompleteLesson.mockResolvedValue({
        success: true,
        skipped: "anonymous",
      });
    });

    it("3 問解くとできたことを出し、登録への誘導と章へのリンクを出し、完了を持ち主なしで端末に預ける", async () => {
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "32,000"]);

      expect(screen.getByText("achievement")).toBeTruthy();
      expect(screen.getByTestId("lesson-score").textContent).toBe("doneScore");
      // ログインしているかはサーバーが決めるので、未ログインでも記録を試みる
      expect(mockCompleteLesson).toHaveBeenCalledTimes(1);

      expect(
        (await screen.findByRole("link", { name: "signUp.cta" })).getAttribute(
          "href",
        ),
      ).toBe("/sign-up");
      expect(
        screen
          .getByRole("link", { name: "signUp.secondary" })
          .getAttribute("href"),
      ).toBe("/learn/mangan-ko-ron");
      // 登録後に引き継ぐため端末に預ける（持ち主は付けない）
      expect(readPendingLessonCompletions()).toEqual([
        expect.objectContaining({ slug: "mangan-ko-ron" }),
      ]);
      expect(readPendingLessonCompletions()[0]).not.toHaveProperty("userId");
    });

    it("通信に失敗しても、未ログインなら失敗の注記ではなく登録への誘導を出し、完了は預ける", async () => {
      mockCompleteLesson.mockRejectedValueOnce(new Error("network"));
      const errorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);

      expect(
        await screen.findByRole("link", { name: "signUp.cta" }),
      ).toBeTruthy();
      expect(screen.queryByTestId("lesson-save-failed")).toBeNull();
      expect(readPendingLessonCompletions()).toEqual([
        expect.objectContaining({ slug: "mangan-ko-ron" }),
      ]);
      errorSpy.mockRestore();
    });
  });

  describe("ログイン済み", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(signedIn);
    });

    it("完了を 1 回だけ記録し、記録できてから次の一歩への導線を出す", async () => {
      const save = deferred<{ success: true }>();
      mockCompleteLesson.mockReturnValue(save.promise);
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);

      expect(screen.getByTestId("lesson-score").textContent).toBe(
        "doneScorePerfect",
      );
      // 保存中は次へ進めない（押せないボタンで記録中と示す）
      expect(
        (screen.getByTestId("lesson-saving") as HTMLButtonElement).disabled,
      ).toBe(true);
      expect(screen.queryByRole("link", { name: "nextLesson" })).toBeNull();
      expect(mockCompleteLesson).toHaveBeenCalledTimes(1);
      expect(mockCompleteLesson).toHaveBeenCalledWith("mangan-ko-ron");

      await act(async () => {
        save.resolve({ success: true });
        await save.promise;
      });

      expect(
        screen.getByRole("link", { name: "nextLesson" }).getAttribute("href"),
      ).toBe("/lessons/mangan-ko-tsumo");
      expect(readPendingLessonCompletions()).toEqual([]);
    });

    it("次の一歩にプレビューがあれば、記録できたあとボタンの代わりに出す", async () => {
      mockUseAuth.mockReturnValue(signedIn);
      render(
        <LessonView
          slug="mangan-ko-ron"
          messageKey="manganKoRon"
          chapterSlug="mangan-ko-ron"
          next={{
            href: "/lessons/mangan-ko-tsumo",
            label: "nextLesson",
            preview: <p data-testid="preview" />,
          }}
          explanation={<p />}
        />,
      );
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);

      expect(await screen.findByTestId("preview")).toBeTruthy();
      expect(screen.queryByRole("link", { name: "nextLesson" })).toBeNull();
    });

    it("完了画面にやり直しの導線は出さない", async () => {
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);

      expect(
        await screen.findByRole("link", { name: "nextLesson" }),
      ).toBeTruthy();
      expect(screen.queryByRole("button", { name: "retry" })).toBeNull();
    });

    it("保存に失敗したら完了を端末に預け、解き直さずに再試行して記録できる", async () => {
      mockCompleteLesson.mockRejectedValueOnce(new Error("network"));
      const errorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);

      const failed = await screen.findByTestId("lesson-save-failed");
      expect(failed.getAttribute("role")).toBe("alert");
      // ホームへは補助リンクで行ける。進んでもホームが預かりを同期する
      expect(
        screen
          .getByRole("link", { name: "saveFailed.goHome" })
          .getAttribute("href"),
      ).toBe("/");
      expect(readPendingLessonCompletions()).toEqual([
        expect.objectContaining({ slug: "mangan-ko-ron", userId: "u1" }),
      ]);
      // 学習の完了（できたこと）はそのまま見えている
      expect(screen.getByText("achievement")).toBeTruthy();

      mockCompleteLesson.mockResolvedValueOnce({ success: true });
      fireEvent.click(screen.getByRole("button", { name: "saveFailed.retry" }));

      expect(
        await screen.findByRole("link", { name: "nextLesson" }),
      ).toBeTruthy();
      expect(mockCompleteLesson).toHaveBeenCalledTimes(2);
      // 記録できたので預かりは外れる
      expect(readPendingLessonCompletions()).toEqual([]);
      errorSpy.mockRestore();
    });

    it("保存中に再試行ボタンは出ず、多重送信にならない", async () => {
      const save = deferred<{ success: true }>();
      mockCompleteLesson.mockReturnValue(save.promise);
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);

      expect(
        screen.queryByRole("button", { name: "saveFailed.retry" }),
      ).toBeNull();
      expect(mockCompleteLesson).toHaveBeenCalledTimes(1);

      await act(async () => {
        save.resolve({ success: true });
        await save.promise;
      });
      expect(screen.getByRole("link", { name: "nextLesson" })).toBeTruthy();
    });

    it("サーバーにセッションが無ければ本人の id 付きで預け、ログインし直す導線を出す", async () => {
      mockCompleteLesson.mockResolvedValueOnce({
        success: true,
        skipped: "anonymous",
      });
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);

      await screen.findByTestId("lesson-signed-out");
      expect(
        screen
          .getByRole("link", { name: "signedOut.signIn" })
          .getAttribute("href"),
      ).toBe("/sign-in?redirect=%2Flessons%2Fmangan-ko-ron");
      expect(readPendingLessonCompletions()).toEqual([
        expect.objectContaining({ slug: "mangan-ko-ron", userId: "u1" }),
      ]);
      expect(screen.queryByRole("link", { name: "nextLesson" })).toBeNull();
    });
  });

  /**
   * 練習の開始・次の問題と同じく、問題を画面の先頭に置く。jsdom はレイアウトを
   * 持たないので、スクロール先が本文のアンカーであることだけを見る
   */
  describe("本文の先頭へのスクロール", () => {
    let scrollIntoView: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
      scrollIntoView = vi
        .spyOn(Element.prototype, "scrollIntoView")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      scrollIntoView.mockRestore();
      vi.useRealTimers();
    });

    function scrolledAnchorIds() {
      const targets = scrollIntoView.mock.instances as unknown as Element[];
      return targets.map((target) => target.id);
    }

    it("説明の段階では送らない", () => {
      renderLesson();
      expect(scrolledAnchorIds()).toEqual([]);
    });

    it("確認問題を始めるとアンカーへ送る", () => {
      renderLesson();
      startQuiz();
      expect(scrolledAnchorIds()).toEqual([LESSON_SCROLL_ANCHOR_ID]);
    });

    it("次の問題へ進むと、次のフレームでアンカーへ送る", () => {
      renderLesson();
      startQuiz();
      scrollIntoView.mockClear();

      fireEvent.click(choice("8,000"));
      fireEvent.click(screen.getByRole("button", { name: "next" }));
      act(() => {
        vi.advanceTimersToNextFrame();
      });

      expect(scrolledAnchorIds()).toEqual([LESSON_SCROLL_ANCHOR_ID]);
    });

    it("完了画面へ進むとアンカーへ送る", () => {
      renderLesson();
      startQuiz();
      fireEvent.click(choice("8,000"));
      fireEvent.click(screen.getByRole("button", { name: "next" }));
      fireEvent.click(choice("12,000"));
      fireEvent.click(screen.getByRole("button", { name: "next" }));
      fireEvent.click(choice("16,000"));
      scrollIntoView.mockClear();

      fireEvent.click(screen.getByRole("button", { name: "finish" }));

      expect(screen.getByTestId("lesson-achievement")).toBeTruthy();
      expect(scrolledAnchorIds()).toEqual([LESSON_SCROLL_ANCHOR_ID]);
    });
  });

  describe("ブラウザの戻る / 進む", () => {
    it("確認問題から戻ると説明に戻り、進むと答えた状態の問題に戻る", async () => {
      renderLesson();
      startQuiz();
      fireEvent.click(choice("8,000"));

      await traverse("back");
      expect(screen.getByTestId("explanation")).toBeTruthy();
      expect(screen.queryByTestId("lesson-condition")).toBeNull();

      await traverse("forward");
      expect(screen.getByTestId("lesson-condition")).toBeTruthy();
      expect((choice("8,000") as HTMLButtonElement).disabled).toBe(true);
    });

    it("説明に戻ってからもう一度始めると、途中の問題から続ける", async () => {
      renderLesson();
      startQuiz();
      fireEvent.click(choice("8,000"));
      fireEvent.click(screen.getByRole("button", { name: "next" }));

      await traverse("back");
      startQuiz();

      // 2 問目に答えていないので選択肢は押せ、3 問目まで答えると終われる
      expect((choice("12,000") as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(choice("12,000"));
      fireEvent.click(screen.getByRole("button", { name: "next" }));
      fireEvent.click(choice("16,000"));
      expect(screen.getByRole("button", { name: "finish" })).toBeTruthy();
    });

    it("完了画面から戻ると最後の問題に戻り、終え直しても二重には記録しない", async () => {
      mockUseAuth.mockReturnValue(signedIn);
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);
      expect(
        await screen.findByRole("link", { name: "nextLesson" }),
      ).toBeTruthy();

      await traverse("back");
      expect(screen.getByRole("button", { name: "finish" })).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "finish" }));
      expect(screen.getByTestId("lesson-achievement")).toBeTruthy();
      expect(mockCompleteLesson).toHaveBeenCalledTimes(1);
    });

    it("記録のあと Next.js が履歴の state を書き直しても、戻る → 進むで完了画面に戻る", async () => {
      mockUseAuth.mockReturnValue(signedIn);
      // Server Action の再検証のあと、Next.js は今の項目の state を自分の
      // 内部状態だけで書き直す（段階のキーが消える）
      mockCompleteLesson.mockImplementation(async () => {
        window.history.replaceState({ __NA: true }, "");
        return { success: true };
      });
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);
      await screen.findByRole("link", { name: "nextLesson" });

      await traverse("back");
      expect(screen.getByRole("button", { name: "finish" })).toBeTruthy();
      await traverse("forward");
      expect(screen.getByTestId("lesson-achievement")).toBeTruthy();
    });

    it("解き終えてから説明まで戻って始めると、最初の問題から解き直す", async () => {
      mockUseAuth.mockReturnValue(signedIn);
      renderLesson();
      startQuiz();
      answerAll(["8,000", "12,000", "16,000"]);
      await screen.findByRole("link", { name: "nextLesson" });

      await traverse("back");
      await traverse("back");
      expect(screen.getByTestId("explanation")).toBeTruthy();
      // 記録できたので、説明の下は完了済みの導線と解き直しのリンクになる
      expect(screen.getByTestId("related")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "retakeQuiz" }));

      expect((choice("8,000") as HTMLButtonElement).disabled).toBe(false);
      answerAll(["8,000", "12,000", "16,000"]);
      expect(screen.getByTestId("lesson-achievement")).toBeTruthy();
      expect(mockCompleteLesson).toHaveBeenCalledTimes(1);
    });
  });
});
