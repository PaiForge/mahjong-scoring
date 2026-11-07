import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth as mockUseAuth } from "@/test/auth-context-mock";

import {
  deriveLessonProgress,
  LessonProgressProvider,
  LessonProgressScope,
  useLessonProgress,
} from "./lesson-progress-provider";

const { mockGetCompleted } = vi.hoisted(() => ({
  mockGetCompleted: vi.fn<() => Promise<string[]>>(),
}));

vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("../_actions/get-completed-lesson-slugs", () => ({
  getCompletedLessonSlugs: mockGetCompleted,
}));

/** 範囲の進み具合を文字にして出す（値が無ければ "none"） */
function ProgressProbe() {
  const progress = useLessonProgress();
  if (progress === undefined) return <p data-testid="probe">none</p>;
  return (
    <p data-testid="probe">
      {`${progress.completedCount}/${progress.totalCount} next=${progress.nextSlug ?? "-"}`}
    </p>
  );
}

const SCOPE = ["about-this-app", "why-scoring-is-complex", "mangan-ko-ron"];

function renderScoped() {
  return render(
    <LessonProgressProvider>
      <LessonProgressScope lessonSlugs={SCOPE}>
        <ProgressProbe />
      </LessonProgressScope>
    </LessonProgressProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
});

describe("deriveLessonProgress", () => {
  it("ゲスト（空集合）は次が範囲の最初・進捗 0（静的 HTML と同じ）", () => {
    expect(deriveLessonProgress(new Set(), SCOPE)).toMatchObject({
      nextSlug: "about-this-app",
      completedCount: 0,
      totalCount: 3,
    });
  });

  it("次は範囲の並びで最初の未完了、完了数は範囲の中だけを数える", () => {
    const progress = deriveLessonProgress(
      new Set(["about-this-app", "jantou-fu"]),
      SCOPE,
    );
    expect(progress.nextSlug).toBe("why-scoring-is-complex");
    expect(progress.completedCount).toBe(1);
  });

  it("範囲のレッスンをすべて終えていれば次は無い", () => {
    expect(
      deriveLessonProgress(new Set(SCOPE), SCOPE).nextSlug,
    ).toBeUndefined();
  });
});

describe("LessonProgressProvider", () => {
  it("ゲストには何も配らず、Server Action も呼ばない（行は props の値で描く）", () => {
    renderScoped();
    expect(screen.getByTestId("probe").textContent).toBe("none");
    expect(mockGetCompleted).not.toHaveBeenCalled();
  });

  it("ログインしたら本人の完了を 1 回取り、範囲で数え直して配る", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockResolvedValue(["about-this-app"]);
    renderScoped();
    await waitFor(() =>
      expect(screen.getByTestId("probe").textContent).toBe(
        "1/3 next=why-scoring-is-complex",
      ),
    );
    expect(mockGetCompleted).toHaveBeenCalledTimes(1);
  });

  it("取り終えるまでは何も配らない", () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockReturnValue(new Promise(() => {}));
    renderScoped();
    expect(screen.getByTestId("probe").textContent).toBe("none");
  });

  it("取得に失敗したらゲストの状態のまま", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockRejectedValue(new Error("network"));
    renderScoped();
    await act(async () => {});
    expect(screen.getByTestId("probe").textContent).toBe("none");
  });

  it("別のユーザーに切り替わったら前のユーザーの完了を使わない", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockResolvedValueOnce(["about-this-app"]);
    const { rerender } = renderScoped();
    await waitFor(() =>
      expect(screen.getByTestId("probe").textContent).toBe(
        "1/3 next=why-scoring-is-complex",
      ),
    );

    let resolveSecond: (slugs: string[]) => void = () => {};
    mockGetCompleted.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSecond = resolve;
      }),
    );
    mockUseAuth.mockReturnValue({ user: { id: "u2" }, isLoading: false });
    rerender(
      <LessonProgressProvider>
        <LessonProgressScope lessonSlugs={SCOPE}>
          <ProgressProbe />
        </LessonProgressScope>
      </LessonProgressProvider>,
    );
    // u2 の分を取り終えるまでは、u1 の完了ではなくゲストの状態
    expect(screen.getByTestId("probe").textContent).toBe("none");

    await act(async () => {
      resolveSecond([]);
    });
    expect(screen.getByTestId("probe").textContent).toBe(
      "0/3 next=about-this-app",
    );
  });

  it("ログアウトしたら完了を配らない", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockResolvedValue(["about-this-app"]);
    const { rerender } = renderScoped();
    await waitFor(() =>
      expect(screen.getByTestId("probe").textContent).not.toBe("none"),
    );
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    rerender(
      <LessonProgressProvider>
        <LessonProgressScope lessonSlugs={SCOPE}>
          <ProgressProbe />
        </LessonProgressScope>
      </LessonProgressProvider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("none");
  });

  it("Scope の外（Provider だけ）では値を持たない", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockResolvedValue(["about-this-app"]);
    render(
      <LessonProgressProvider>
        <ProgressProbe />
      </LessonProgressProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId("probe").textContent).toBe("none");
  });
});
