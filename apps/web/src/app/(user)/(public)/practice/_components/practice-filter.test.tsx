import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let currentQuery = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentQuery),
}));

const { PracticeFilter } = await import("./practice-filter");

const ITEMS = [
  {
    key: "jantou-fu",
    rank: "kyu-4" as const,
    category: "fuCalculation" as const,
    card: <p>雀頭の符計算</p>,
  },
  {
    key: "yaku-han",
    rank: "kyu-5" as const,
    category: "han" as const,
    card: <p>役の翻数</p>,
  },
  {
    key: "mangan-score-calculation",
    rank: "kyu-5" as const,
    category: "scoring" as const,
    card: <p>満貫以上点数計算</p>,
  },
  {
    key: "score-table",
    category: "scoring" as const,
    card: <p>点数表早引き</p>,
  },
];

const OPTION_GROUPS = [
  [{ label: "すべて" }],
  [
    {
      filter: { kind: "rank" as const, value: "kyu-5" as const },
      label: "5級",
    },
    {
      filter: { kind: "rank" as const, value: "kyu-4" as const },
      label: "4級",
    },
  ],
  [
    {
      filter: { kind: "category" as const, value: "fuCalculation" as const },
      label: "符",
    },
    {
      filter: { kind: "category" as const, value: "han" as const },
      label: "翻数",
    },
    {
      filter: { kind: "category" as const, value: "scoring" as const },
      label: "点数",
    },
  ],
];

function renderFilter(query: string) {
  currentQuery = query;
  return render(
    <PracticeFilter
      items={ITEMS}
      optionGroups={OPTION_GROUPS}
      filterLabel="練習を絞り込む"
      listHeading="練習メニュー"
    />,
  );
}

describe("PracticeFilter", () => {
  it("絞り込みが無ければ全件を出す", () => {
    const { queryByText } = renderFilter("");

    expect(queryByText("雀頭の符計算")).toBeTruthy();
    expect(queryByText("役の翻数")).toBeTruthy();
    expect(queryByText("点数表早引き")).toBeTruthy();
  });

  it("級で絞るとその級の練習だけになる", () => {
    const { queryByText } = renderFilter("rank=kyu-5");

    expect(queryByText("役の翻数")).toBeTruthy();
    expect(queryByText("満貫以上点数計算")).toBeTruthy();
    expect(queryByText("雀頭の符計算")).toBeNull();
    // 級を持たない練習は級で絞ると隠れる
    expect(queryByText("点数表早引き")).toBeNull();
  });

  it("分野で絞るとその分野の練習だけになる", () => {
    const { queryByText } = renderFilter("category=scoring");

    expect(queryByText("満貫以上点数計算")).toBeTruthy();
    // 分野で絞るときは級を持たない練習も残る
    expect(queryByText("点数表早引き")).toBeTruthy();
    expect(queryByText("役の翻数")).toBeNull();
  });

  it("級と分野が両方指定されても掛け合わせず、級だけで絞る", () => {
    // 掛け合わせると 4級 × 翻数 のような 0 件の組み合わせが生まれる
    const { queryByText } = renderFilter("rank=kyu-5&category=fuCalculation");

    expect(queryByText("役の翻数")).toBeTruthy();
    expect(queryByText("雀頭の符計算")).toBeNull();
  });

  it("知らない値は絞り込み無しとして扱う", () => {
    // 級や分野が増減したあとに共有された古いリンクで空の一覧を見せない
    const { queryByText } = renderFilter("rank=kyu-9");

    expect(queryByText("雀頭の符計算")).toBeTruthy();
    expect(queryByText("点数表早引き")).toBeTruthy();
  });

  it("選択中の選択肢だけを現在地として示す", () => {
    const { getByText } = renderFilter("category=han");

    expect(getByText("翻数").getAttribute("aria-current")).toBe("true");
    expect(getByText("すべて").getAttribute("aria-current")).toBeNull();
    expect(getByText("5級").getAttribute("aria-current")).toBeNull();
  });

  it("見出しの階層のために h2 を 1 つ持つ", () => {
    // 分野の見出しを絞り込みに置き換えたため、h1 からカードの h3 へ
    // 直接飛ばないようにしている
    const { container } = renderFilter("");

    const headings = container.querySelectorAll("h2");
    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent).toBe("練習メニュー");
  });
});
