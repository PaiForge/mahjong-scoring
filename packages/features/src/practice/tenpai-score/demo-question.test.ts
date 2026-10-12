import { describe, expect, it } from "vitest";
import { HaiKind } from "@mahjong-scoring/core";

import { TENPAI_SCORE_DEMO_QUESTION } from "./demo-question";

function waitOf(agariHai: number) {
  const wait = TENPAI_SCORE_DEMO_QUESTION.waits.find(
    (w) => w.agariHai === agariHai,
  );
  if (wait === undefined) throw new Error("待ちが見つからない");
  return wait;
}

function yakuNames(question: {
  readonly yakuDetails?: readonly { name: string }[];
}) {
  return (question.yakuDetails ?? []).map((y) => y.name);
}

describe("TENPAI_SCORE_DEMO_QUESTION", () => {
  it("二筒・五筒の両面待ちの、リーチしている子の手", () => {
    expect(TENPAI_SCORE_DEMO_QUESTION.waits.map((w) => w.agariHai)).toEqual([
      HaiKind.PinZu2,
      HaiKind.PinZu5,
    ]);
    expect(TENPAI_SCORE_DEMO_QUESTION.tehai.closed).toHaveLength(13);
    expect(TENPAI_SCORE_DEMO_QUESTION.isRiichi).toBe(true);
    expect(TENPAI_SCORE_DEMO_QUESTION.uraDoraMarkers).toHaveLength(1);
  });

  it("二筒なら三色同順が付いて満貫になる", () => {
    const wait = waitOf(HaiKind.PinZu2);
    expect(yakuNames(wait.ron!)).toContain("三色同順");
    expect(wait.ron!.answer.payment).toEqual({ type: "ron", amount: 8000 });
  });

  it("五筒なら立直・断么九だけの 2600 点（ツモは 1000・2000）", () => {
    const wait = waitOf(HaiKind.PinZu5);
    expect(yakuNames(wait.ron!)).not.toContain("三色同順");
    expect(wait.ron!.answer.han).toBe(2);
    expect(wait.ron!.answer.fu).toBe(40);
    expect(wait.ron!.answer.payment).toEqual({ type: "ron", amount: 2600 });
    expect(wait.tsumo.answer.han).toBe(3);
    expect(wait.tsumo.answer.fu).toBe(30);
  });
});
