import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

// 共通の intl-mock は `t.rich` のタグを描かずキーだけを返すため、タグの中に
// 置く押せる正解が消える。ここではタグ関数を呼ぶスタブを使う
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.rich = (
      key: string,
      tags: Record<string, (chunks: ReactNode[]) => ReactNode>,
    ) => tags.answer?.([]) ?? key;
    return t;
  },
}));

const { RevealedScoreAnswer } = await import("./revealed-score-answer");

describe("RevealedScoreAnswer", () => {
  beforeEach(() => {
    cleanup();
  });

  it("点数表の位置を渡さなければ押せる要素を持たない", () => {
    render(
      <RevealedScoreAnswer
        answer={{ type: "ron", score: 3900 }}
        translationNamespace="x"
      />,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("正解の点数を押すと、その条件の点数表がモーダルで開く", () => {
    render(
      <RevealedScoreAnswer
        answer={{ type: "oyaTsumo", all: 3900 }}
        translationNamespace="x"
        scoreTableFocus={{ role: "oya", winType: "tsumo", han: 3, fu: 40 }}
      />,
    );

    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "3900all" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
