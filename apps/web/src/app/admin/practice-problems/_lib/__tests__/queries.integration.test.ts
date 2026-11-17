// @vitest-environment node
import { createHash } from "node:crypto";

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("@/lib/db", async () => {
  const { practiceProblemsTestDb } =
    await import("@/lib/practice-problems/test-database");
  return {
    ...(await import("@/lib/db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL
      ? practiceProblemsTestDb()
      : undefined,
  };
});

import type {
  AgariProblemPayload,
  TenpaiProblemPayload,
} from "@mahjong-scoring/core";

import { practiceProblems } from "@/lib/db/schema";
import {
  clearPracticeProblemsTestDb,
  closePracticeProblemsTestDb,
  practiceProblemsTestDb,
  setupPracticeProblemsTestDb,
} from "@/lib/practice-problems/test-database";

import {
  fetchPracticeProblemComposition,
  fetchPracticeProblemCounts,
  fetchPracticeProblemDailyCounts,
} from "../queries";

const url = process.env.BILLING_TEST_DATABASE_URL;

/** 2026-11-10〜11-11（JST）。from = 11/10 0:00 JST、toExclusive = 11/12 0:00 JST */
const RANGE = {
  startDate: "2026-11-10",
  endDate: "2026-11-11",
  from: new Date("2026-11-09T15:00:00Z"),
  toExclusive: new Date("2026-11-11T15:00:00Z"),
} as const;

/** 和了形の盤面（既定は子・ロン・リーチなし・門前） */
function agariPayload(
  overrides: Partial<AgariProblemPayload> = {},
): AgariProblemPayload {
  return {
    hand: { closed: [0, 1, 2], exposed: [] },
    agariHai: 2,
    isTsumo: false,
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [0],
    riichi: null,
    ...overrides,
  };
}

/** 聴牌形の盤面（既定は子・リーチなし・門前。isTsumo のキーを持たない） */
function tenpaiPayload(
  overrides: Partial<TenpaiProblemPayload> = {},
): TenpaiProblemPayload {
  return {
    hand: { closed: [0, 1, 2], exposed: [] },
    jikaze: 28,
    bakaze: 27,
    doraMarkers: [0],
    riichi: null,
    ...overrides,
  };
}

let sequence = 0;

/** 行を直接 INSERT する（content_hash は行ごとに別の 16 進 64 文字） */
async function insertRow(row: {
  readonly kind: "agari-score" | "tenpai-score";
  readonly source?: string;
  readonly payload: AgariProblemPayload | TenpaiProblemPayload;
  readonly createdAt: Date;
}) {
  sequence += 1;
  await practiceProblemsTestDb()
    .insert(practiceProblems)
    .values({
      kind: row.kind,
      schemaVersion: 1,
      identityVersion: 1,
      contentHash: createHash("sha256").update(String(sequence)).digest("hex"),
      payload: row.payload,
      source: row.source ?? "web",
      createdAt: row.createdAt,
    });
}

// 明示されたローカル DB の専用スキーマだけを使う。アプリの表・journal には触れない。
describe.skipIf(!url)("問題の保存状況の集計（PostgreSQL）", () => {
  beforeAll(setupPracticeProblemsTestDb);
  afterAll(closePracticeProblemsTestDb);
  beforeEach(clearPracticeProblemsTestDb);

  it("日ごとの件数は JST の日付で束ねる（14:59:59Z は当日、15:00:00Z は翌日）", async () => {
    await insertRow({
      kind: "agari-score",
      payload: agariPayload(),
      createdAt: new Date("2026-11-10T14:59:59Z"),
    });
    await insertRow({
      kind: "agari-score",
      payload: agariPayload(),
      createdAt: new Date("2026-11-10T15:00:00Z"),
    });

    expect(await fetchPracticeProblemDailyCounts(RANGE)).toEqual([
      { date: "2026-11-10", count: 1 },
      { date: "2026-11-11", count: 1 },
    ]);
  });

  it("期間は半開区間で、toExclusive ちょうどの行は期間外", async () => {
    await insertRow({
      kind: "agari-score",
      payload: agariPayload(),
      createdAt: RANGE.from,
    });
    await insertRow({
      kind: "agari-score",
      payload: agariPayload(),
      createdAt: RANGE.toExclusive,
    });

    const [row] = await fetchPracticeProblemCounts(RANGE);
    expect(row).toMatchObject({
      kind: "agari-score",
      source: "web",
      total: 2,
      inPeriod: 1,
    });
    const daily = await fetchPracticeProblemDailyCounts(RANGE);
    expect(daily.reduce((sum, day) => sum + day.count, 0)).toBe(1);
  });

  it("種別 × 由来ごとにまとめ、最終保存日時を Date で返す", async () => {
    const latest = new Date("2026-11-11T03:00:00Z");
    await insertRow({
      kind: "agari-score",
      source: "web",
      payload: agariPayload(),
      createdAt: new Date("2026-11-01T00:00:00Z"),
    });
    await insertRow({
      kind: "agari-score",
      source: "web",
      payload: agariPayload(),
      createdAt: latest,
    });
    await insertRow({
      kind: "tenpai-score",
      source: "ios",
      payload: tenpaiPayload(),
      createdAt: new Date("2026-11-10T00:00:00Z"),
    });

    const rows = await fetchPracticeProblemCounts(RANGE);
    const agariWeb = rows.find(
      (row) => row.kind === "agari-score" && row.source === "web",
    );
    expect(agariWeb).toMatchObject({ total: 2, inPeriod: 1 });
    expect(agariWeb?.lastSavedAt).toBeInstanceOf(Date);
    expect(agariWeb?.lastSavedAt?.getTime()).toBe(latest.getTime());
    expect(
      rows.find((row) => row.kind === "tenpai-score" && row.source === "ios"),
    ).toMatchObject({ total: 1, inPeriod: 1 });
  });

  it("内訳: リーチは riichi がオブジェクトの行だけ、暗槓だけの手は副露に数えずポンは数える、聴牌形のツモは 0、jikaze 27 だけが親", async () => {
    const createdAt = new Date("2026-11-10T00:00:00Z");
    // 和了形 4 行
    await insertRow({
      kind: "agari-score",
      payload: agariPayload({ riichi: null }),
      createdAt,
    });
    await insertRow({
      kind: "agari-score",
      payload: agariPayload({
        riichi: { uraDoraMarkers: [3] },
        isTsumo: true,
        jikaze: 27,
        hand: {
          closed: [0, 1, 2],
          exposed: [{ type: "ankan", hais: [9, 9, 9, 9] }],
        },
      }),
      createdAt,
    });
    await insertRow({
      kind: "agari-score",
      payload: agariPayload({
        hand: {
          closed: [0, 1, 2],
          exposed: [
            { type: "ankan", hais: [9, 9, 9, 9] },
            { type: "pon", hais: [31, 31, 31], from: "toimen" },
          ],
        },
      }),
      createdAt,
    });
    await insertRow({
      kind: "agari-score",
      payload: agariPayload({
        isTsumo: true,
        hand: {
          closed: [0, 1, 2],
          exposed: [{ type: "pon", hais: [31, 31, 31], from: "kamicha" }],
        },
      }),
      createdAt,
    });
    // 聴牌形 2 行（isTsumo のキーが無い）
    await insertRow({
      kind: "tenpai-score",
      payload: tenpaiPayload({ riichi: { uraDoraMarkers: [] }, jikaze: 27 }),
      createdAt,
    });
    await insertRow({
      kind: "tenpai-score",
      payload: tenpaiPayload({ jikaze: 29 }),
      createdAt,
    });

    const rows = await fetchPracticeProblemComposition();
    expect([...rows].sort((a, b) => (a.kind < b.kind ? -1 : 1))).toEqual([
      { kind: "agari-score", total: 4, riichi: 1, furo: 2, tsumo: 2, oya: 1 },
      { kind: "tenpai-score", total: 2, riichi: 1, furo: 0, tsumo: 0, oya: 1 },
    ]);
  });

  it("行が 1 つも無ければ、集計は空で、日ごとの件数は全日 0", async () => {
    expect(await fetchPracticeProblemCounts(RANGE)).toEqual([]);
    expect(await fetchPracticeProblemComposition()).toEqual([]);
    expect(await fetchPracticeProblemDailyCounts(RANGE)).toEqual([
      { date: "2026-11-10", count: 0 },
      { date: "2026-11-11", count: 0 },
    ]);
  });
});
