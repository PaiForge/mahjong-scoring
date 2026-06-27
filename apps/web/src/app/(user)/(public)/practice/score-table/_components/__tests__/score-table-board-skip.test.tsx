import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// next-intl: キーをそのまま返す簡易モック
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values?.count !== undefined ? `${key}:${values.count}` : key;
    return t;
  },
}));

// 出題の han 値を制御するキュー。空なら連番で返す。
let hanQueue: number[] = [];
let counter = 0;

function makeQuestion(han: number) {
  return {
    id: `q-${counter}-${han}`,
    isOya: false,
    isTsumo: false,
    han,
    fu: 30,
    correctAnswer: { type: "ron", score: 1000 },
  };
}

// 出題だけを差し替える（他の core エクスポートは実物を使う）
vi.mock("@mahjong-scoring/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mahjong-scoring/core")>();
  return {
    ...actual,
    generateScoreTableQuestion: () => {
      counter += 1;
      const han = hanQueue.length > 0 ? hanQueue.shift()! : counter;
      return makeQuestion(han);
    },
  };
});

import { ScoreTableBoard } from "../score-table-board";

describe("ScoreTableBoard スキップ", () => {
  beforeEach(() => {
    counter = 0;
    hanQueue = [];
  });

  it("allowSkip 時はスキップボタンが表示され、クリックで次の問題に進む", () => {
    // 初期 han=1, スキップ後 han=2
    hanQueue = [1, 2];
    render(
      <ScoreTableBoard showFeedback={false} onAnswer={() => {}} allowSkip />,
    );

    expect(screen.getByText("han:1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "skip" }));
    expect(screen.getByText("han:2")).toBeTruthy();
  });

  it("直前と同一表示の問題は引き直し、必ず別の問題に進む", () => {
    // 初期 han=5。スキップで 5（同一→引き直し）→ 5（同一→引き直し）→ 7 を返す。
    hanQueue = [5, 5, 5, 7];
    render(
      <ScoreTableBoard showFeedback={false} onAnswer={() => {}} allowSkip />,
    );

    expect(screen.getByText("han:5")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "skip" }));
    // 5 が連続せず 7 に進む
    expect(screen.getByText("han:7")).toBeTruthy();
  });

  it("allowSkip 未指定時はスキップボタンを表示しない", () => {
    render(<ScoreTableBoard showFeedback={false} onAnswer={() => {}} />);
    expect(screen.queryByRole("button", { name: "skip" })).toBeNull();
  });
});
