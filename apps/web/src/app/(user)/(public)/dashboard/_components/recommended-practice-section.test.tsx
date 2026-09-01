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

  it("段級位ピルを練習一覧と同じ辞書から引く", async () => {
    const { container } = render(
      await RecommendedPracticeSection({ slugs: ["jantou-fu"] }),
    );

    // jantou-fu はカタログ上 4級の練習
    const pill = container.querySelector("[data-belt-slug]");
    expect(pill?.getAttribute("data-belt-slug")).toBe("kyu-4");
    expect(pill?.textContent).toContain("names.kyu-4");
  });

  it("段級位ピルは対応する昇級試験へのリンクになっている", async () => {
    const { container } = render(
      await RecommendedPracticeSection({ slugs: ["jantou-fu"] }),
    );

    const pill = container.querySelector("a[data-belt-slug]");
    expect(pill?.getAttribute("href")).toBe("/exam/fu");
    // 級名だけでは行き先が読めないため、リンクの名前は行き先まで含める
    // （級は「昇級試験」、段は「昇段試験」と種別で引き分ける）
    expect(pill?.getAttribute("aria-label")).toBe("examTitle.kyu");
  });

  it("勧める練習が無ければ何も描画しない", async () => {
    const { container } = render(
      <div>{await RecommendedPracticeSection({ slugs: [] })}</div>,
    );

    expect(container.querySelector("a")).toBeNull();
  });
});
