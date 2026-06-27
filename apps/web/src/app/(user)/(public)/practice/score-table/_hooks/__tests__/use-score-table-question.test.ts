import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// 出題の han 値を制御するキュー。空なら連番で返す。
let hanQueue: number[] = [];
let counter = 0;

vi.mock("@mahjong-scoring/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mahjong-scoring/core")>();
  return {
    ...actual,
    generateScoreTableQuestion: () => {
      counter += 1;
      const han = hanQueue.length > 0 ? hanQueue.shift()! : counter;
      return {
        id: `q-${counter}-${han}`,
        isOya: false,
        isTsumo: false,
        han,
        fu: 30,
        correctAnswer: { type: "ron", score: 1000 },
      };
    },
  };
});

import { useScoreTableQuestion } from "../use-score-table-question";

describe("useScoreTableQuestion", () => {
  beforeEach(() => {
    counter = 0;
    hanQueue = [];
  });

  it("advance で次の問題に進む", () => {
    hanQueue = [1, 2];
    const { result } = renderHook(() => useScoreTableQuestion());
    expect(result.current.question.han).toBe(1);

    act(() => result.current.advance());
    expect(result.current.question.han).toBe(2);
  });

  it("直前と同一表示の問題は引き直し、必ず別の問題に進む", () => {
    // 初期=5、advance で 5（同一→引き直し）×2 のあと 7 を返す
    hanQueue = [5, 5, 5, 7];
    const { result } = renderHook(() => useScoreTableQuestion());
    expect(result.current.question.han).toBe(5);

    act(() => result.current.advance());
    expect(result.current.question.han).toBe(7);
  });
});
