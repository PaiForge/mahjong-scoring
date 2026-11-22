// @vitest-environment node
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../db", async () => {
  const { practiceProblemsTestDb } = await import("./test-database");
  return {
    ...(await import("../db/schema")),
    db: process.env.BILLING_TEST_DATABASE_URL
      ? practiceProblemsTestDb()
      : undefined,
  };
});
vi.mock("../log-error", async () => await import("@/test/log-error-mock"));
vi.mock(
  "@mahjong-scoring/features/problem-facets/compute",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@mahjong-scoring/features/problem-facets/compute")
      >();
    return {
      ...original,
      computeProblemFacets: vi.fn(original.computeProblemFacets),
    };
  },
);

import { logExternalError } from "@/test/log-error-mock";
import { SCORING_VERSION } from "@mahjong-scoring/core";
import {
  eligibleAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
} from "@mahjong-scoring/features/daily-problem/test-fixtures";
import { computeProblemFacets } from "@mahjong-scoring/features/problem-facets/compute";
import {
  noYakuAgariPayload,
  noYakuRonTenpaiPayload,
  riichiTenpaiPayload,
} from "@mahjong-scoring/features/problem-facets/test-fixtures";
import { asc, eq } from "drizzle-orm";

import {
  practiceProblemFacetSets,
  practiceProblemFacets,
  practiceProblems,
  type PracticeProblem,
} from "../db/schema";

import { archivePracticeProblem, ensurePracticeProblem } from "./archive";
import { countProblemFacetCoverage, fillMissingProblemFacets } from "./facets";
import {
  clearPracticeProblemsTestDb,
  closePracticeProblemsTestDb,
  practiceProblemsTestDb,
  setupPracticeProblemsTestDb,
} from "./test-database";
import { meldedAgariRequest, riichiTenpaiRequest } from "./test-requests";

const url = process.env.BILLING_TEST_DATABASE_URL;

let sequence = 0;

/** 保存の入口を通さずに盤面を 1 行入れる（属性の行は無い） */
async function insertProblem(
  kind: "agari-score" | "tenpai-score",
  payload: PracticeProblem["payload"],
): Promise<string> {
  sequence += 1;
  const [row] = await practiceProblemsTestDb()
    .insert(practiceProblems)
    .values({
      kind,
      schemaVersion: 1,
      identityVersion: 1,
      contentHash: sequence.toString(16).padStart(64, "0"),
      payload,
      source: "web",
      // 古い順に読むことを確かめるため、入れた順に 1 秒ずつずらす
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, sequence)),
    })
    .returning({ id: practiceProblems.id });
  if (!row) throw new Error("Missing fixture");
  return row.id;
}

function facetSets() {
  return practiceProblemsTestDb()
    .select()
    .from(practiceProblemFacetSets)
    .orderBy(asc(practiceProblemFacetSets.computedAt));
}

function facetRows(problemId: string) {
  return practiceProblemsTestDb()
    .select()
    .from(practiceProblemFacets)
    .where(eq(practiceProblemFacets.problemId, problemId))
    .orderBy(
      asc(practiceProblemFacets.agariHai),
      // ツモ（true）を先に並べる
      asc(practiceProblemFacets.isTsumo),
    );
}

describe.skipIf(!url)("問題の属性の補充（PostgreSQL）", () => {
  beforeAll(setupPracticeProblemsTestDb);
  afterAll(closePracticeProblemsTestDb);
  beforeEach(async () => {
    vi.clearAllMocks();
    await clearPracticeProblemsTestDb();
  });

  it("和了形は親 1 行と子 1 行、聴牌形は待ち × ツモ/ロンの子の行を、この版で書く", async () => {
    const agari = await insertProblem("agari-score", eligibleAgariPayload());
    const tenpai = await insertProblem(
      "tenpai-score",
      noYakuRonTenpaiPayload(),
    );

    const result = await fillMissingProblemFacets();
    expect(result).toMatchObject({
      computed: 2,
      failed: 0,
      skipped: 0,
      errored: 0,
    });

    const sets = await facetSets();
    expect(sets.map((set) => [set.scoringVersion, set.status])).toEqual([
      [SCORING_VERSION, "ok"],
      [SCORING_VERSION, "ok"],
    ]);
    expect(sets.find((set) => set.problemId === tenpai)).toMatchObject({
      isOya: false,
      isMenzen: true,
      isRiichi: false,
      kanCount: 0,
      jikaze: 28,
      bakaze: 27,
      waitCount: 2,
      error: null,
      revision: null,
    });
    expect(sets.find((set) => set.problemId === agari)?.waitCount).toBeNull();

    expect(await facetRows(agari)).toEqual([
      {
        problemId: agari,
        scoringVersion: SCORING_VERSION,
        agariHai: 22,
        isTsumo: true,
        result: "scored",
        han: 2,
        fu: 30,
        scoreLevel: "Normal",
        yakumanMultiplier: 0,
        points: 2000,
        yaku: ["MenzenTsumo", "Riichi"],
        doraHan: 0,
        uraDoraHan: 0,
        machi: "Kanchan",
        variesByRenfonpai: false,
        variesByKiriage: false,
        variesByYakumanRules: false,
      },
    ]);
    expect(
      (await facetRows(tenpai)).map((row) => [
        row.agariHai,
        row.isTsumo,
        row.result,
        row.yaku,
        row.variesByKiriage,
      ]),
    ).toEqual([
      [20, false, "noYaku", null, null],
      [20, true, "scored", ["MenzenTsumo"], false],
      [26, false, "noYaku", null, null],
      [26, true, "scored", ["MenzenTsumo"], false],
    ]);
  });

  it("何度呼んでも行は増えず、2 回目は何も計算しない", async () => {
    const id = await insertProblem("tenpai-score", riichiTenpaiPayload());
    await fillMissingProblemFacets();
    const before = [await facetSets(), await facetRows(id)];

    expect(await fillMissingProblemFacets()).toMatchObject({
      computed: 0,
      failed: 0,
      skipped: 0,
      errored: 0,
    });
    expect([await facetSets(), await facetRows(id)]).toEqual(before);
    expect(before[1]).toHaveLength(6);
  });

  it("標準ルールで組み立てられない盤面は、理由を持つ failed の親だけを書き、埋め直さない", async () => {
    const id = await insertProblem("agari-score", noYakuAgariPayload());

    expect(await fillMissingProblemFacets()).toMatchObject({
      computed: 0,
      failed: 1,
    });
    expect(await facetSets()).toMatchObject([
      { problemId: id, status: "failed", error: "noYaku", isOya: null },
    ]);
    expect(await facetRows(id)).toEqual([]);
    expect(await fillMissingProblemFacets()).toMatchObject({
      computed: 0,
      failed: 0,
    });
    expect(await countProblemFacetCoverage()).toEqual([
      { kind: "agari-score", total: 1, ok: 0, failed: 1, missing: 0 },
    ]);
  });

  it("上限までを古い順に計算し、残りを未計算として数える。次の実行が続きを埋める", async () => {
    const first = await insertProblem("agari-score", eligibleAgariPayload());
    const second = await insertProblem(
      "agari-score",
      otherEligibleAgariPayload(),
    );
    const third = await insertProblem(
      "agari-score",
      kiriageBoundaryAgariPayload(),
    );

    expect(await fillMissingProblemFacets({ limit: 2 })).toMatchObject({
      computed: 2,
    });
    expect((await facetSets()).map((set) => set.problemId).sort()).toEqual(
      [first, second].sort(),
    );
    expect(await countProblemFacetCoverage()).toEqual([
      { kind: "agari-score", total: 3, ok: 2, failed: 0, missing: 1 },
    ]);

    expect(await fillMissingProblemFacets({ limit: 2 })).toMatchObject({
      computed: 1,
    });
    expect(await facetRows(third)).toHaveLength(1);
    expect(await countProblemFacetCoverage()).toEqual([
      { kind: "agari-score", total: 3, ok: 3, failed: 0, missing: 0 },
    ]);
  });

  it("時間の上限を過ぎたら、読んだ問題が残っていても計算せずに終える", async () => {
    await insertProblem("agari-score", eligibleAgariPayload());

    expect(await fillMissingProblemFacets({ budgetMs: 0 })).toMatchObject({
      computed: 0,
      errored: 0,
    });
    expect(await facetSets()).toEqual([]);
    expect(await fillMissingProblemFacets()).toMatchObject({ computed: 1 });
  });

  it("問題を指定すると、その問題だけを計算する（空の指定は何もしない）", async () => {
    const target = await insertProblem("agari-score", eligibleAgariPayload());
    await insertProblem("agari-score", otherEligibleAgariPayload());

    expect(await fillMissingProblemFacets({ problemIds: [] })).toMatchObject({
      computed: 0,
    });
    expect(await facetSets()).toEqual([]);

    expect(
      await fillMissingProblemFacets({ problemIds: [target] }),
    ).toMatchObject({ computed: 1 });
    expect((await facetSets()).map((set) => set.problemId)).toEqual([target]);
  });

  it("別の版の行は計算済みに数えず、この版の行を別に書く", async () => {
    const id = await insertProblem("agari-score", eligibleAgariPayload());
    const otherVersion = SCORING_VERSION + 1;
    await practiceProblemsTestDb().insert(practiceProblemFacetSets).values({
      problemId: id,
      scoringVersion: otherVersion,
      status: "failed",
      error: "noYaku",
    });
    expect(await countProblemFacetCoverage()).toEqual([
      { kind: "agari-score", total: 1, ok: 0, failed: 0, missing: 1 },
    ]);

    expect(await fillMissingProblemFacets()).toMatchObject({ computed: 1 });
    expect(
      (await facetSets()).map((set) => [set.scoringVersion, set.status]).sort(),
    ).toEqual(
      [
        [SCORING_VERSION, "ok"],
        [otherVersion, "failed"],
      ].sort(),
    );
    expect(await countProblemFacetCoverage()).toEqual([
      { kind: "agari-score", total: 1, ok: 1, failed: 0, missing: 0 },
    ]);
  });

  it("子の行を書けなければ親の行も残さず、ほかの問題は計算を続ける", async () => {
    const broken = await insertProblem("agari-score", eligibleAgariPayload());
    const healthy = await insertProblem(
      "agari-score",
      otherEligibleAgariPayload(),
    );
    // 1 問目だけ、CHECK 制約に反する子の行（採点済みなのに翻が 0）を返させる
    vi.mocked(computeProblemFacets).mockImplementationOnce((input) => {
      const facets = vi.mocked(computeProblemFacets).getMockImplementation()?.(
        input,
      );
      if (!facets) throw new Error("Missing implementation");
      return {
        set: facets.set,
        rows: facets.rows.map((row) => ({ ...row, han: 0 })),
      };
    });

    expect(await fillMissingProblemFacets()).toMatchObject({
      computed: 1,
      errored: 1,
    });
    expect((await facetSets()).map((set) => set.problemId)).toEqual([healthy]);
    expect(await facetRows(broken)).toEqual([]);
    // ログには問題の ID と PostgreSQL のエラーコード（CHECK 違反）だけを出す
    expect(logExternalError).toHaveBeenCalledWith(
      "fillMissingProblemFacets",
      expect.stringContaining(broken),
      "23514",
    );

    // 未計算のまま残っているので、次の実行が埋める
    expect(await fillMissingProblemFacets()).toMatchObject({ computed: 1 });
    expect(await facetRows(broken)).toHaveLength(1);
  });

  it("並行して呼んでも、同じ問題の行は 1 組だけになる", async () => {
    const ids = [
      await insertProblem("agari-score", eligibleAgariPayload()),
      await insertProblem("tenpai-score", riichiTenpaiPayload()),
      await insertProblem("tenpai-score", noYakuRonTenpaiPayload()),
    ];

    const results = await Promise.all([
      fillMissingProblemFacets(),
      fillMissingProblemFacets(),
      fillMissingProblemFacets(),
    ]);
    expect(results.reduce((sum, result) => sum + result.computed, 0)).toBe(3);
    expect(results.reduce((sum, result) => sum + result.errored, 0)).toBe(0);
    expect(await facetSets()).toHaveLength(3);
    expect(
      await Promise.all(ids.map(async (id) => (await facetRows(id)).length)),
    ).toEqual([1, 6, 4]);
  });

  it("保存の入口は、新しく入れた問題の属性を続けて書く（同じ盤面の再送では書かない）", async () => {
    await archivePracticeProblem(riichiTenpaiRequest(), "web");
    expect(await facetSets()).toMatchObject([{ status: "ok" }]);
    expect(computeProblemFacets).toHaveBeenCalledTimes(1);

    await archivePracticeProblem(riichiTenpaiRequest(), "ios");
    expect(await facetSets()).toHaveLength(1);
    expect(computeProblemFacets).toHaveBeenCalledTimes(1);
  });

  it("報告の保存（ID 取得）も、新しく入れた問題の属性を書く", async () => {
    const { parsePracticeProblemArchiveRequest } =
      await import("@mahjong-scoring/core");
    const parsed = parsePracticeProblemArchiveRequest(meldedAgariRequest());
    if (parsed.isErr()) throw new Error(parsed.error);

    const id = await ensurePracticeProblem(parsed.value, "web");
    expect(await facetSets()).toMatchObject([{ problemId: id, status: "ok" }]);
    expect(await facetRows(id)).toHaveLength(1);
  });

  it("属性を書けなくても、保存は成功のままにする", async () => {
    vi.mocked(computeProblemFacets).mockImplementationOnce(() => {
      throw new Error("boom");
    });
    expect(await archivePracticeProblem(riichiTenpaiRequest(), "web")).toEqual({
      ok: true,
    });
    expect(
      await practiceProblemsTestDb().select().from(practiceProblems),
    ).toHaveLength(1);
    expect(await facetSets()).toEqual([]);
  });
});
