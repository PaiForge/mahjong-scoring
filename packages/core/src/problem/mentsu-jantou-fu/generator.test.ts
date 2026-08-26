import { describe, it, expect } from "vitest";
import { MentsuType, isYaochu } from "@pai-forge/riichi-mahjong";
import { generateMentsuJantouFuQuestion } from "./generator";
import { expectGeneratesEventually, expectSampled } from "../../test/sampling";
import type { MentsuJantouFuItem } from "./types";

/** その回答行が手牌の中の暗刻（副露していない刻子）か */
function isClosedKoutsu(item: MentsuJantouFuItem): boolean {
  return item.type === MentsuType.Koutsu && !item.isOpen;
}

describe("generateMentsuJantouFuQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateMentsuJantouFuQuestion);
  });

  it("和了牌が槓子（カン）の牌種と一致しない", () => {
    // 槓子は同じ牌4枚を束縛するため5枚目が存在せず、その牌では和了できない。
    // （例: 7筒アンカンなのに和了牌が7筒、という不正な問題を防ぐ回帰テスト）
    // 一方、暗刻＋チー等で同一牌種が手牌に4枚あっても和了は合法なので、
    // 「4枚あるか」ではなく「カンの牌種か」で判定する。
    const questions = expectSampled(generateMentsuJantouFuQuestion, {
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

  it("ロン和了で和了牌を含む刻子は明刻の符になる", () => {
    // learn/tehai-fu「ロン牌を含む刻子の誤計上」で注意している形。
    // シャンポン待ちをロンした側の刻子は、手牌に2枚持っていても最後の1枚を
    // 他家から受けているため暗刻にはならない（中張牌なら4符ではなく2符）。
    const questions = expectSampled(generateMentsuJantouFuQuestion, {
      attempts: 3000,
      need: 3000,
    });

    let shanponRonSeen = 0;

    for (const q of questions) {
      for (const item of q.items) {
        if (!isClosedKoutsu(item)) continue;

        const yaochu = isYaochu(item.tiles[0]);
        const isRonKoutsu =
          !q.context.isTsumo && item.tiles[0] === q.context.agariHai;
        if (isRonKoutsu) shanponRonSeen++;

        // 明刻は暗刻の半分（中張 2/4符、么九 4/8符）
        const expected = isRonKoutsu ? (yaochu ? 4 : 2) : yaochu ? 8 : 4;
        expect(item.fu).toBe(expected);
      }
    }

    // 検証対象の形が1件も出ていなければ、テストが素通りしているだけ
    expect(shanponRonSeen).toBeGreaterThan(0);
  });

  it("ロン和了の和了牌は暗刻と暗順子に跨らない", () => {
    // 同じ牌種が暗刻と暗順子の両方にある手でその牌をロンすると、
    // どちらを完成させたかで刻子の符が 4 符とも 2 符とも読めてしまう。
    const questions = expectSampled(generateMentsuJantouFuQuestion, {
      attempts: 3000,
      need: 3000,
      where: (q) => !q.context.isTsumo,
    });

    for (const q of questions) {
      const closedGroups = q.items.filter(
        (item) => !item.isOpen && item.type !== MentsuType.Kantsu,
      );
      const holders = closedGroups.filter((item) =>
        item.tiles.includes(q.context.agariHai),
      );
      const hasKoutsu = holders.some(isClosedKoutsu);

      if (hasKoutsu) expect(holders).toHaveLength(1);
    }
  });

  it("ID は注入した採番関数から取り、問題と回答行で重複しない", () => {
    // 採番を注入できるので、ID を含めて生成結果を決定的に検証できる。
    let seq = 0;
    const question = generateMentsuJantouFuQuestion({
      idGen: () => `id-${seq++}`,
    });

    expect(question).toBeDefined();
    if (!question) return;

    const ids = [question.id, ...question.items.map((item) => item.id)];
    expect(ids.every((id) => id.startsWith("id-"))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
