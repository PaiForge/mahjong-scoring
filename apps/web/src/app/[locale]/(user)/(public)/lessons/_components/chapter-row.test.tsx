import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth as mockUseAuth } from "@/test/auth-context-mock";

import { ChapterRow, type ChapterRowData } from "./chapter-row";
import {
  LessonProgressProvider,
  LessonProgressScope,
} from "./lesson-progress-provider";

const { mockGetCompleted } = vi.hoisted(() => ({
  mockGetCompleted: vi.fn<() => Promise<string[]>>(),
}));

vi.mock("next-intl", async () => await import("@/test/intl-mock"));
vi.mock(
  "@/app/_contexts/auth-context",
  async () => await import("@/test/auth-context-mock"),
);
vi.mock("../_actions/get-completed-lesson-slugs", () => ({
  getCompletedLessonSlugs: mockGetCompleted,
}));

const lessonRow: ChapterRowData = {
  slug: "jantou-fu",
  kind: "lesson",
  section: "fu",
  order: 30,
  navTarget: { href: "/lessons/jantou-fu", crossLocale: false },
  title: "title",
  description: "description",
};

/** `<li>` を素の DOM に置けないため `<ol>` で包む */
function renderRow(row: ReactNode) {
  return render(<ol>{row}</ol>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: undefined, isLoading: false });
});

describe("ChapterRow", () => {
  it("Provider の無い場所（LP・道場・ダッシュボード）は props の印をそのまま描く", () => {
    const { container } = renderRow(
      <ChapterRow row={lessonRow} isDone={false} isNext anchored={false} />,
    );
    const li = container.querySelector("li");
    expect(li?.getAttribute("data-next")).toBe("true");
    expect(li?.getAttribute("aria-current")).toBe("step");
    expect(li?.getAttribute("id")).toBeNull();
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/lessons/jantou-fu",
    );
  });

  it("anchored なら行に #chapter-<slug> の id を付ける", () => {
    const { container } = renderRow(
      <ChapterRow row={lessonRow} isDone={false} isNext={false} anchored />,
    );
    expect(container.querySelector("li")?.id).toBe("chapter-jantou-fu");
  });

  it("本人の完了を取り終えたら props（ゲストの状態）より Provider の値が勝つ", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
    mockGetCompleted.mockResolvedValue(["jantou-fu"]);
    const { container } = renderRow(
      <LessonProgressProvider>
        <LessonProgressScope lessonSlugs={["jantou-fu", "mentsu-fu"]}>
          {/* 静的 HTML と同じ: 完了なし・次はこの行 */}
          <ChapterRow row={lessonRow} isDone={false} isNext anchored />
        </LessonProgressScope>
      </LessonProgressProvider>,
    );
    const li = container.querySelector("li");
    expect(li?.getAttribute("data-next")).toBe("true");

    await waitFor(() => expect(li?.getAttribute("data-done")).toBe("true"));
    expect(li?.getAttribute("data-next")).toBeNull();
    expect(
      li?.querySelector('[data-testid="curriculum-achieved-mark"]'),
    ).not.toBeNull();
    expect(
      li?.querySelector('[data-testid="curriculum-next-badge"]'),
    ).toBeNull();
  });

  it('その言語で出していない章は「日本語のみ」の印付きの <a hrefLang="ja"> にする', () => {
    const { container } = renderRow(
      <ChapterRow
        row={{
          ...lessonRow,
          slug: "about-this-app",
          navTarget: { href: "/lessons/about-this-app", crossLocale: true },
        }}
        isDone={false}
        isNext={false}
        anchored={false}
      />,
    );
    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/lessons/about-this-app");
    expect(anchor?.getAttribute("hrefLang")).toBe("ja");
    // 印はリンク名に入り（読み上げでも分かる）、行いっぱいの押せる面は保つ
    expect(anchor?.textContent).toContain("japaneseOnly");
    expect(anchor?.className).toContain("after:absolute");
  });

  it("コラムの行は印を持たず、言語をまたぐときは同じく印を添える", () => {
    const { container } = renderRow(
      <ChapterRow
        row={{
          ...lessonRow,
          slug: "why-scoring-is-hard-to-learn",
          kind: "column",
          section: "introduction",
          description: undefined,
          navTarget: {
            href: "/lessons/why-scoring-is-hard-to-learn",
            crossLocale: true,
          },
        }}
        isDone
        isNext
        anchored={false}
      />,
    );
    const li = container.querySelector("li");
    expect(li?.getAttribute("data-column")).toBe("true");
    expect(li?.getAttribute("aria-current")).toBeNull();
    expect(
      li?.querySelector('[data-testid="curriculum-achieved-mark"]'),
    ).toBeNull();
    expect(container.querySelector("a")?.getAttribute("hrefLang")).toBe("ja");
    expect(container.querySelector("a")?.textContent).toContain("japaneseOnly");
  });
});
