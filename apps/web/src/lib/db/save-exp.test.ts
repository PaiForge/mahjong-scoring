import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const { mockCalculateExp, mockBuildExpInfo } = vi.hoisted(() => ({
  mockCalculateExp: vi.fn(),
  mockBuildExpInfo: vi.fn(),
}));

// レベルの判定は core の `buildExpInfo`（core 側でテスト済み）。ここでは
// 獲得量と付与後の累計を正しく渡すかだけを見るため、本物を包んで呼び出しを記録する
vi.mock("@mahjong-scoring/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mahjong-scoring/core")>();
  mockBuildExpInfo.mockImplementation(actual.buildExpInfo);
  return {
    ...actual,
    calculateExp: (...args: unknown[]) => mockCalculateExp(...args),
    buildExpInfo: mockBuildExpInfo,
  };
});

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

vi.mock("./index", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock("./schema", async () => await import("@/test/schema-mock"));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MockTxOptions {
  /** `.returning()` の返却値（insert expEvents）。空配列を返すと重複扱い。 */
  readonly expEventsInsertReturning: ReadonlyArray<{
    id: string;
    amount: number;
  }>;
  readonly totalExpAfterGrant: number;
  /** 重複時の select の返却値 */
  readonly existingEvent?: {
    readonly amount: number;
    readonly metadata: Record<string, unknown> | null;
  };
}

function createMockTx(opts: MockTxOptions) {
  let insertCallCount = 0;

  const tx = {
    insert: vi.fn().mockImplementation(() => {
      insertCallCount++;
      const callNum = insertCallCount;

      return {
        values: vi.fn().mockImplementation(() => {
          if (callNum === 1) {
            // First insert: expEvents (onConflictDoNothing → returning)
            return {
              onConflictDoNothing: vi.fn().mockReturnValue({
                returning: vi
                  .fn()
                  .mockResolvedValue(opts.expEventsInsertReturning),
              }),
            };
          }
          // Second insert: userExp (onConflictDoUpdate → returning)
          return {
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi
                .fn()
                .mockResolvedValue([{ totalExp: opts.totalExpAfterGrant }]),
            }),
          };
        }),
      };
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockResolvedValue(opts.existingEvent ? [opts.existingEvent] : []),
        }),
      }),
    }),
  };
  return tx;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseParams = {
  userId: "user-001",
  challengeResultId: "result-001",
  menuType: "jantou_fu",
  score: 20,
  incorrectAnswers: 1,
  timeTaken: 30,
  leaderboardKey: "default",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("grantChallengeExp", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCalculateExp.mockReturnValue({
      baseExp: 20,
      accuracyMultiplier: 1.2,
      totalExp: 24,
    });
  });

  it("calculateExp を score / incorrectAnswers / menuType で呼び出す（streak なし）", async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: "event-1", amount: 24 }],
      totalExpAfterGrant: 200,
    });
    const { grantChallengeExp } = await import("./save-exp");

    await grantChallengeExp(tx as never, baseParams);

    expect(mockCalculateExp).toHaveBeenCalledWith({
      score: 20,
      incorrectAnswers: 1,
      menuType: "jantou_fu",
    });
    // 引数は 3 つだけ（streak は存在しない）
    const call = mockCalculateExp.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.keys(call)).toEqual(
      expect.arrayContaining(["score", "incorrectAnswers", "menuType"]),
    );
    expect(call).not.toHaveProperty("dailyChallengeCount");
  });

  it("expEvents と userExp の 2 回の insert を行う", async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: "event-1", amount: 24 }],
      totalExpAfterGrant: 24,
    });
    const { grantChallengeExp } = await import("./save-exp");

    await grantChallengeExp(tx as never, baseParams);

    expect(tx.insert).toHaveBeenCalledTimes(2);
  });

  it("totalExpAfter を metadata に格納するため update を呼ぶ", async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: "event-1", amount: 24 }],
      totalExpAfterGrant: 200,
    });
    const { grantChallengeExp } = await import("./save-exp");

    await grantChallengeExp(tx as never, baseParams);

    expect(tx.update).toHaveBeenCalledTimes(1);
  });

  it("挿入した獲得量と加算後の累計から ExpInfo を作って返す", async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: "event-1", amount: 24 }],
      totalExpAfterGrant: 200,
    });
    const { grantChallengeExp } = await import("./save-exp");

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(mockBuildExpInfo).toHaveBeenCalledWith({
      earned: 24,
      totalExpAfter: 200,
    });
    expect(result).toEqual(mockBuildExpInfo.mock.results[0]?.value);
    expect(result).toMatchObject({ earnedExp: 24, totalExp: 200 });
  });

  it("重複時（onConflictDoNothing で 0 件）は既存イベントから ExpInfo を再構築する", async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [], // 重複
      totalExpAfterGrant: 0,
      existingEvent: {
        amount: 24,
        metadata: { totalExpAfter: 200 },
      },
    });
    const { grantChallengeExp } = await import("./save-exp");

    const result = await grantChallengeExp(tx as never, baseParams);

    // userExp への insert は呼ばれない（重複なので）
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(tx.update).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
    // 初回と同じく metadata の付与後の累計から作る（levelUp の判定が初回と一致する）
    expect(mockBuildExpInfo).toHaveBeenCalledWith({
      earned: 24,
      totalExpAfter: 200,
    });
    expect(result).toMatchObject({ earnedExp: 24, totalExp: 200 });
  });

  it("重複再取得で metadata.totalExpAfter が欠けていても amount にフォールバックする", async () => {
    // 冪等リビルドで古いメタデータ（totalExpAfter 未設定）を扱うケース
    const tx = createMockTx({
      expEventsInsertReturning: [], // duplicate
      totalExpAfterGrant: 0,
      existingEvent: {
        amount: 42,
        metadata: { score: 10, incorrectAnswers: 0 }, // totalExpAfter 欠落
      },
    });
    const { grantChallengeExp } = await import("./save-exp");

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).not.toBeNull();
    expect(result?.earnedExp).toBe(42);
    // totalExpAfter が欠けているので amount を使う → totalExp === earnedExp
    expect(result?.totalExp).toBe(42);
  });

  it("重複再取得で metadata が null でも安全にフォールバックする", async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [],
      totalExpAfterGrant: 0,
      existingEvent: {
        amount: 30,
        metadata: null,
      },
    });
    const { grantChallengeExp } = await import("./save-exp");

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).not.toBeNull();
    expect(result?.earnedExp).toBe(30);
    expect(result?.totalExp).toBe(30);
  });

  it("重複再取得で既存イベントが空配列の場合はゼロ値の ExpInfo を返す", async () => {
    // 競合 INSERT が 0 件 かつ 既存 SELECT でも行が取れない異常系
    // （現実には発生しない想定だが防御的挙動を検証）
    const tx = createMockTx({
      expEventsInsertReturning: [],
      totalExpAfterGrant: 0,
      // existingEvent 未指定 → select が [] を返す
    });
    const { grantChallengeExp } = await import("./save-exp");

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).toEqual({
      earnedExp: 0,
      totalExp: 0,
      level: 0,
      levelUp: false,
      progressPercent: 0,
    });
  });

  it("calculateExp が undefined を返したら（未登録 menuType）付与を完全にスキップする", async () => {
    mockCalculateExp.mockReturnValue(undefined);
    const tx = createMockTx({
      expEventsInsertReturning: [],
      totalExpAfterGrant: 0,
    });
    const { grantChallengeExp } = await import("./save-exp");

    const result = await grantChallengeExp(tx as never, {
      ...baseParams,
      menuType: "machi_fu", // 現状ホワイトリストに無い
    });

    expect(result).toBeUndefined();
    expect(tx.insert).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.select).not.toHaveBeenCalled();
  });
});
