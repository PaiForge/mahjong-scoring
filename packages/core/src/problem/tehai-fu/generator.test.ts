import { describe, it, expect } from "vitest";
import { MentsuType } from "@pai-forge/riichi-mahjong";
import { generateTehaiFuQuestion } from "./generator";

describe("generateTehaiFuQuestion", () => {
  it("100回試行して少なくとも1回は問題が生成される", () => {
    let generated = false;
    for (let i = 0; i < 100; i++) {
      if (generateTehaiFuQuestion()) {
        generated = true;
        break;
      }
    }
    expect(generated).toBe(true);
  });

  it("和了牌が槓子（カン）の牌種と一致しない", () => {
    // 槓子は同じ牌4枚を束縛するため5枚目が存在せず、その牌では和了できない。
    // （例: 7筒アンカンなのに和了牌が7筒、という不正な問題を防ぐ回帰テスト）
    // 一方、暗刻＋チー等で同一牌種が手牌に4枚あっても和了は合法なので、
    // 「4枚あるか」ではなく「カンの牌種か」で判定する。
    let tested = 0;
    for (let i = 0; i < 2000; i++) {
      const q = generateTehaiFuQuestion();
      if (!q) continue;
      for (const m of q.tehai.exposed) {
        if (m.type === MentsuType.Kantsu) {
          expect(q.context.agariHai).not.toBe(m.hais[0]);
        }
      }
      tested++;
    }
    expect(tested).toBeGreaterThan(0);
  });
});
