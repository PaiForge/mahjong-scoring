import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth as mockUseAuth } from "@/test/auth-context-mock";

import { CurriculumProgressBarView } from "./curriculum-progress-bar-view";
import {
  LessonProgressProvider,
  LessonProgressScope,
} from "./lesson-progress-provider";

const { mockGetCompleted } = vi.hoisted(() => ({
  mockGetCompleted: vi.fn<() => Promise<string[]>>(),
}));

vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) =>
      values ? `${key}:${JSON.stringify(values)}` : key,
}));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("../_actions/get-completed-lesson-slugs", () => ({
  getCompletedLessonSlugs: mockGetCompleted,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
});

describe("CurriculumProgressBarView", () => {
  it("ゲストは props（静的 HTML の値）を描く", () => {
    const { container } = render(
      <LessonProgressProvider>
        <LessonProgressScope lessonSlugs={["a", "b", "c", "d"]}>
          <CurriculumProgressBarView
            completedCount={0}
            totalCount={4}
            allCompleted={false}
          />
        </LessonProgressScope>
      </LessonProgressProvider>,
    );
    expect(
      container
        .querySelector('[role="progressbar"]')
        ?.getAttribute("aria-valuenow"),
    ).toBe("0");
  });

  it("本人の完了を取り終えたら範囲で数えた完了数と分母で上書きする", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    // 範囲の外の完了（"z"）は分子に数えない
    mockGetCompleted.mockResolvedValue(["a", "z"]);
    const { container } = render(
      <LessonProgressProvider>
        <LessonProgressScope lessonSlugs={["a", "b", "c", "d"]}>
          <CurriculumProgressBarView
            completedCount={0}
            totalCount={4}
            allCompleted={false}
          />
        </LessonProgressScope>
      </LessonProgressProvider>,
    );
    await waitFor(() =>
      expect(
        container
          .querySelector('[role="progressbar"]')
          ?.getAttribute("aria-valuenow"),
      ).toBe("25"),
    );
    expect(container.textContent).toContain('"done":1');
    expect(container.textContent).toContain('"total":4');
  });

  it("範囲をすべて終えていれば満ちたバーにする", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockResolvedValue(["a", "b"]);
    const { container } = render(
      <LessonProgressProvider>
        <LessonProgressScope lessonSlugs={["a", "b"]}>
          <CurriculumProgressBarView
            completedCount={0}
            totalCount={2}
            allCompleted={false}
          />
        </LessonProgressScope>
      </LessonProgressProvider>,
    );
    await waitFor(() =>
      expect(
        container.querySelector('[role="progressbar"] > div')?.className,
      ).not.toContain("bg-success/70"),
    );
  });
});
