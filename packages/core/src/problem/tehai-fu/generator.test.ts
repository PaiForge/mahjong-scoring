import { describe, it, expect } from "vitest";
import { MentsuType } from "@pai-forge/riichi-mahjong";
import { generateTehaiFuQuestion } from "./generator";
import { expectGeneratesEventually, expectSampled } from "../../test/sampling";

describe("generateTehaiFuQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateTehaiFuQuestion);
  });

  it("和了牌が槓子（カン）の牌種と一致しない", () => {
    // 槓子は同じ牌4枚を束縛するため5枚目が存在せず、その牌では和了できない。
    // （例: 7筒アンカンなのに和了牌が7筒、という不正な問題を防ぐ回帰テスト）
    // 一方、暗刻＋チー等で同一牌種が手牌に4枚あっても和了は合法なので、
    // 「4枚あるか」ではなく「カンの牌種か」で判定する。
    const questions = expectSampled(generateTehaiFuQuestion, {
      attempts: 2000,
      need: 2000,
    });

    for (const q of questions) {
      for (const m of q.tehai.exposed) {
        if (m.type === MentsuType.Kantsu) {
          expect(q.context.agariHai).not.toBe(m.hais[0]);
        }
      }
    }
  });
});
