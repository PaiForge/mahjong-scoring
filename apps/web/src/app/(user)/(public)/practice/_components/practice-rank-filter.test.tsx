import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let currentQuery = "";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(currentQuery),
}));

const { PracticeRankFilter } = await import("./practice-rank-filter");

const SECTIONS = [
  {
    key: "fuCalculation",
    title: "符の計算",
    cards: [
      { key: "jantou-fu", rank: "kyu-4" as const, card: <p>雀頭の符計算</p> },
      { key: "total-fu", rank: "kyu-4" as const, card: <p>手牌の合計符</p> },
    ],
  },
  {
    key: "scoring",
    title: "点数計算",
    cards: [
      { key: "score-table", card: <p>点数表早引き</p> },
      {
        key: "mangan-score-calculation",
        rank: "kyu-5" as const,
        card: <p>満貫以上点数計算</p>,
      },
    ],
  },
];

const OPTIONS = [
  { label: "すべて" },
  { rank: "kyu-5" as const, label: "5級" },
  { rank: "kyu-4" as const, label: "4級" },
];

function renderFilter(query: string) {
  currentQuery = query;
  return render(
    <PracticeRankFilter
      sections={SECTIONS}
      options={OPTIONS}
      filterLabel="段級位で絞り込む"
    />,
  );
}

describe("PracticeRankFilter", () => {
  it("絞り込みが無ければ全件を出す", () => {
    const { queryByText } = renderFilter("");

    expect(queryByText("雀頭の符計算")).toBeTruthy();
    expect(queryByText("点数表早引き")).toBeTruthy();
    expect(queryByText("満貫以上点数計算")).toBeTruthy();
  });

  it("級を指定するとその級の練習だけになる", () => {
    const { queryByText } = renderFilter("rank=kyu-5");

    expect(queryByText("満貫以上点数計算")).toBeTruthy();
    expect(queryByText("雀頭の符計算")).toBeNull();
    // 級を持たない練習は級で絞ると隠れる
    expect(queryByText("点数表早引き")).toBeNull();
  });

  it("空になったカテゴリは見出しごと消す", () => {
    const { queryByText } = renderFilter("rank=kyu-4");

    expect(queryByText("符の計算")).toBeTruthy();
    expect(queryByText("点数計算")).toBeNull();
  });

  it("知らない級は絞り込み無しとして扱う", () => {
    // 級が増減したあとに共有された古いリンクで空の一覧を見せない
    const { queryByText } = renderFilter("rank=kyu-9");

    expect(queryByText("雀頭の符計算")).toBeTruthy();
    expect(queryByText("満貫以上点数計算")).toBeTruthy();
  });

  it("選択中の級だけを現在地として示す", () => {
    const { getByText } = renderFilter("rank=kyu-4");

    expect(getByText("4級").getAttribute("aria-current")).toBe("true");
    expect(getByText("すべて").getAttribute("aria-current")).toBeNull();
  });
});
