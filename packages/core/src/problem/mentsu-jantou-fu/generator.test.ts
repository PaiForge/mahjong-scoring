import { describe, it, expect } from "vitest";
import { MentsuType, isYaochu } from "@pai-forge/riichi-mahjong";
import { generateMentsuJantouFuQuestion } from "./generator";
import { expectGeneratesEventually, expectSampled } from "../../test/sampling";
import { expectAgariHaiNotKantsuKind } from "../../test/tile-usage";
import { seededRandom } from "../../test/seeded-random";
import { defaultIdGenerator } from "../../core/id";
import type { RandomSource } from "../../core/random";
import type { MentsuJantouFuItem, MentsuJantouFuQuestion } from "./types";

/** その回答行が手牌の中の暗刻（副露していない刻子）か */
function isClosedKoutsu(item: MentsuJantouFuItem): boolean {
  return item.type === MentsuType.Koutsu && !item.isOpen;
}

/**
 * 手牌の中の刻子の符が和了状況を織り込んでいることを確かめる
 *
 * ロンした牌を含む刻子は、手牌に 2 枚持っていても最後の 1 枚を他家から
 * 受けているので明刻の符（暗刻の半分）になる。それ以外は暗刻の符。
 * 検証対象の形（ロンで完成した刻子）が 1 件も無ければ失敗させる。
 */
function expectKoutsuFuReflectsAgari(
  questions: readonly MentsuJantouFuQuestion[],
): void {
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
}

describe("generateMentsuJantouFuQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateMentsuJantouFuQuestion);
  });

  it("和了牌が槓子（カン）の牌種と一致しない", () => {
    const questions = expectSampled(generateMentsuJantouFuQuestion, {
      attempts: 2000,
      need: 2000,
    });

    expectAgariHaiNotKantsuKind(questions);
  });

  it("ロン和了で和了牌を含む刻子は明刻の符になる", () => {
    // learn/tehai-fu「ロン牌を含む刻子の誤計上」で注意している形。
    // シャンポン待ちをロンした側の刻子は、手牌に2枚持っていても最後の1枚を
    // 他家から受けているため暗刻にはならない（中張牌なら4符ではなく2符）。
    const questions = expectSampled(generateMentsuJantouFuQuestion, {
      attempts: 3000,
      need: 3000,
    });

    expectKoutsuFuReflectsAgari(questions);
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

describe("generateMentsuJantouFuQuestion（乱数を固定した出題）", () => {
  /** シードを固定して問題を集める（結果は実行ごとに変わらない） */
  function sampleSeeded(
    options: { readonly renfonpaiAs4Fu?: boolean } = {},
    where?: (question: MentsuJantouFuQuestion) => boolean,
    attempts = 300,
  ) {
    const rng: RandomSource = seededRandom(20261119);
    return expectSampled(
      () =>
        generateMentsuJantouFuQuestion({
          ...options,
          idGen: defaultIdGenerator,
          rng,
        }),
      { attempts, need: attempts, where },
    );
  }

  /** 手牌の右に晒す行（副露した面子と、暗槓を含む槓子） */
  function isShownAsExposed(item: MentsuJantouFuItem): boolean {
    return item.isOpen || item.type === MentsuType.Kantsu;
  }

  it("手牌の副露は、回答行の副露した面子と槓子を同じ順に並べたもの", () => {
    for (const q of sampleSeeded()) {
      expect(q.tehai.exposed).toEqual(
        q.items.filter(isShownAsExposed).map((item) => item.originalMentsu),
      );
    }
  });

  it("暗槓のある手も出題され、暗槓は手牌の右に晒す", () => {
    const withAnkan = sampleSeeded({}, (q) =>
      q.items.some((item) => item.type === MentsuType.Kantsu && !item.isOpen),
    );
    for (const q of withAnkan) {
      const ankan = q.items.filter(
        (item) => item.type === MentsuType.Kantsu && !item.isOpen,
      );
      for (const item of ankan) {
        expect(q.tehai.exposed).toContainEqual(item.originalMentsu);
      }
    }
  });

  it("回答行の副露の印は面子を鳴いたかどうかで、雀頭は副露にしない", () => {
    for (const q of sampleSeeded()) {
      for (const item of q.items) {
        expect(item.isOpen).toBe(!!item.originalMentsu?.furo);
      }
      const pairs = q.items.filter((item) => item.type === "Pair");
      expect(pairs).toHaveLength(1);
    }
  });

  it("ロン和了で和了牌を含む刻子は明刻の符、それ以外の手牌の中の刻子は暗刻の符になる", () => {
    expectKoutsuFuReflectsAgari(sampleSeeded({}, undefined, 1000));
  });

  it("ポンした刻子は和了状況に依らず明刻の符（中張 2 符・么九 4 符）になる", () => {
    let ponSeen = 0;
    for (const q of sampleSeeded()) {
      for (const item of q.items) {
        if (item.type !== MentsuType.Koutsu || !item.isOpen) continue;
        ponSeen++;
        expect(item.fu).toBe(isYaochu(item.tiles[0]) ? 4 : 2);
      }
    }
    // 検証対象の形が1件も出ていなければ、テストが素通りしているだけ
    expect(ponSeen).toBeGreaterThan(0);
  });

  it("順子は 0 符、槓子は明槓 8 符・暗槓 16 符（么九牌なら倍）", () => {
    let kantsuSeen = 0;
    for (const q of sampleSeeded()) {
      for (const item of q.items) {
        if (item.type === MentsuType.Shuntsu) expect(item.fu).toBe(0);
        if (item.type !== MentsuType.Kantsu) continue;
        kantsuSeen++;
        const base = item.isOpen ? 8 : 16;
        expect(item.fu).toBe(isYaochu(item.tiles[0]) ? base * 2 : base);
      }
    }
    // 検証対象の形が1件も出ていなければ、テストが素通りしているだけ
    expect(kantsuSeen).toBeGreaterThan(0);
  });

  it("既定では連風牌の雀頭は 2 符、renfonpaiAs4Fu なら 4 符", () => {
    const isRenfonpaiPair = (q: MentsuJantouFuQuestion) =>
      q.context.bakaze === q.context.jikaze &&
      q.items.some(
        (item) => item.type === "Pair" && item.tiles[0] === q.context.bakaze,
      );
    const pairFu = (q: MentsuJantouFuQuestion) =>
      q.items.find((item) => item.type === "Pair")?.fu;

    for (const q of sampleSeeded({}, isRenfonpaiPair, 3000)) {
      expect(pairFu(q)).toBe(2);
    }
    for (const q of sampleSeeded(
      { renfonpaiAs4Fu: true },
      isRenfonpaiPair,
      3000,
    )) {
      expect(pairFu(q)).toBe(4);
    }
  });
});
