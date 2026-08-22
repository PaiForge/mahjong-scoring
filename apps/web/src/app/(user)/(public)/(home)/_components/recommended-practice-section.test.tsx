import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next-intl/server", async () => await import("@/test/intl-mock"));

const { RecommendedPracticeSection } =
  await import("./recommended-practice-section");

describe("RecommendedPracticeSection", () => {
  it("渡された練習のカードを順に描画する", async () => {
    const { container } = render(
      await RecommendedPracticeSection({ slugs: ["jantou-fu", "mentsu-fu"] }),
    );

    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/practice/jantou-fu");
    expect(hrefs).toContain("/practice/mentsu-fu");
    expect(hrefs.indexOf("/practice/jantou-fu")).toBeLessThan(
      hrefs.indexOf("/practice/mentsu-fu"),
    );
  });

  it("練習一覧へのリンクを持つ", async () => {
    const { container } = render(
      await RecommendedPracticeSection({ slugs: ["jantou-fu"] }),
    );

    const hrefs = Array.from(container.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/practice");
  });

  it("カードから教本へ戻す導線は出さない", async () => {
    const { container } = render(
      await RecommendedPracticeSection({ slugs: ["jantou-fu"] }),
    );

    const hrefs = Array.from(container.querySelectorAll("a")).map(
      (a) => a.getAttribute("href") ?? "",
    );
    expect(hrefs.some((href) => href.startsWith("/learn/"))).toBe(false);
  });

  it("難易度ラベルを練習一覧と同じキーから引く", async () => {
    const { getByText } = render(
      await RecommendedPracticeSection({ slugs: ["jantou-fu"] }),
    );

    // jantou-fu はカタログ上 beginner
    expect(getByText("difficulty.beginner")).toBeTruthy();
  });

  it("勧める練習が無ければ何も描画しない", async () => {
    const { container } = render(
      <div>{await RecommendedPracticeSection({ slugs: [] })}</div>,
    );

    expect(container.querySelector("a")).toBeNull();
  });
});
