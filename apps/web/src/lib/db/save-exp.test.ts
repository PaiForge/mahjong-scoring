import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockCalculateExp = vi.fn();
const mockGetLevel = vi.fn();
const mockGetLevelProgress = vi.fn();

vi.mock('server-only', () => ({}));

vi.mock('@mahjong-scoring/core', () => ({
  calculateExp: (...args: unknown[]) => mockCalculateExp(...args),
  getLevel: (...args: unknown[]) => mockGetLevel(...args),
  getLevelProgress: (...args: unknown[]) => mockGetLevelProgress(...args),
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ _tag: 'and', args }),
  eq: (...args: unknown[]) => ({ _tag: 'eq', args }),
  sql: Object.assign((strings: TemplateStringsArray, ..._values: unknown[]) => strings.join(''), {
    raw: (s: string) => s,
  }),
}));

vi.mock('./index', () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock('./schema', () => ({
  expEvents: {
    id: 'id',
    userId: 'user_id',
    source: 'source',
    sourceId: 'source_id',
    amount: 'amount',
    metadata: 'metadata',
  },
  userExp: { userId: 'user_id', totalExp: 'total_exp' },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MockTxOptions {
  /** `.returning()` の返却値（insert expEvents）。空配列を返すと重複扱い。 */
  readonly expEventsInsertReturning: ReadonlyArray<{ id: string; amount: number }>;
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
                returning: vi.fn().mockResolvedValue(opts.expEventsInsertReturning),
              }),
            };
          }
          // Second insert: userExp (onConflictDoUpdate → returning)
          return {
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ totalExp: opts.totalExpAfterGrant }]),
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
          limit: vi.fn().mockResolvedValue(opts.existingEvent ? [opts.existingEvent] : []),
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
  userId: 'user-001',
  challengeResultId: 'result-001',
  menuType: 'jantou_fu',
  score: 20,
  incorrectAnswers: 1,
  timeTaken: 30,
  leaderboardKey: 'default',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('grantChallengeExp', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCalculateExp.mockReturnValue({
      baseExp: 20,
      accuracyMultiplier: 1.2,
      totalExp: 24,
    });

    mockGetLevel.mockImplementation((exp: number) => Math.floor(exp / 100));
    mockGetLevelProgress.mockImplementation((exp: number) => ({
      level: Math.floor(exp / 100),
      currentLevelExp: Math.floor(exp / 100) * 100,
      nextLevelExp: (Math.floor(exp / 100) + 1) * 100,
      progress: (exp % 100) / 100,
    }));
  });

  it('calculateExp を score / incorrectAnswers / menuType で呼び出す（streak なし）', async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: 'event-1', amount: 24 }],
      totalExpAfterGrant: 200,
    });
    const { grantChallengeExp } = await import('./save-exp');

    await grantChallengeExp(tx as never, baseParams);

    expect(mockCalculateExp).toHaveBeenCalledWith({
      score: 20,
      incorrectAnswers: 1,
      menuType: 'jantou_fu',
    });
    // 引数は 3 つだけ（streak は存在しない）
    const call = mockCalculateExp.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.keys(call)).toEqual(
      expect.arrayContaining(['score', 'incorrectAnswers', 'menuType']),
    );
    expect(call).not.toHaveProperty('dailyChallengeCount');
  });

  it('expEvents と userExp の 2 回の insert を行う', async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: 'event-1', amount: 24 }],
      totalExpAfterGrant: 24,
    });
    const { grantChallengeExp } = await import('./save-exp');

    await grantChallengeExp(tx as never, baseParams);

    expect(tx.insert).toHaveBeenCalledTimes(2);
  });

  it('totalExpAfter を metadata に格納するため update を呼ぶ', async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: 'event-1', amount: 24 }],
      totalExpAfterGrant: 200,
    });
    const { grantChallengeExp } = await import('./save-exp');

    await grantChallengeExp(tx as never, baseParams);

    expect(tx.update).toHaveBeenCalledTimes(1);
  });

  it('ExpInfo を earnedExp / totalExp / level / levelUp 付きで返す', async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: 'event-1', amount: 24 }],
      totalExpAfterGrant: 200,
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).toEqual({
      earnedExp: 24,
      totalExp: 200,
      // getLevel(200) = 2, getLevel(176) = 1 → levelUp
      level: 2,
      levelUp: true,
      progressPercent: 0,
    });
  });

  it('レベル未更新時は levelUp=false', async () => {
    mockCalculateExp.mockReturnValue({
      baseExp: 10,
      accuracyMultiplier: 1.0,
      totalExp: 10,
    });
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: 'event-1', amount: 10 }],
      totalExpAfterGrant: 250,
    });
    const { grantChallengeExp } = await import('./save-exp');

    // getLevel(250)=2, getLevel(240)=2 → no level up
    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).not.toBeNull();
    expect(result?.levelUp).toBe(false);
    expect(result?.level).toBe(2);
  });

  it('重複時（onConflictDoNothing で 0 件）は既存イベントから ExpInfo を再構築する', async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [], // 重複
      totalExpAfterGrant: 0,
      existingEvent: {
        amount: 24,
        metadata: { totalExpAfter: 200 },
      },
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, baseParams);

    // userExp への insert は呼ばれない（重複なので）
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(tx.update).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result?.earnedExp).toBe(24);
    expect(result?.totalExp).toBe(200);
    expect(result?.level).toBe(2); // getLevel(200) = 2
    expect(result?.levelUp).toBe(true); // getLevel(200) > getLevel(176)
  });

  it('一度に複数レベル跨いでも levelUp=true（巨大 EXP ジャンプ）', async () => {
    // earned=1000, totalAfter=1000 → levelBefore=getLevel(0)=0, levelAfter=getLevel(1000)=10
    mockCalculateExp.mockReturnValue({
      baseExp: 1000,
      accuracyMultiplier: 1.0,
      totalExp: 1000,
    });
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: 'event-jump', amount: 1000 }],
      totalExpAfterGrant: 1000,
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).not.toBeNull();
    expect(result?.levelUp).toBe(true);
    // mockGetLevel: floor(exp / 100)
    expect(result?.level).toBe(10);
  });

  it('レベル境界ちょうどを踏んだ場合 levelUp=true', async () => {
    // earned=50, totalAfter=100 → levelBefore=getLevel(50)=0, levelAfter=getLevel(100)=1
    mockCalculateExp.mockReturnValue({
      baseExp: 50,
      accuracyMultiplier: 1.0,
      totalExp: 50,
    });
    const tx = createMockTx({
      expEventsInsertReturning: [{ id: 'event-exact', amount: 50 }],
      totalExpAfterGrant: 100,
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result?.levelUp).toBe(true);
    expect(result?.level).toBe(1);
  });

  it('重複再取得で metadata.totalExpAfter が欠けていても amount にフォールバックする', async () => {
    // 冪等リビルドで古いメタデータ（totalExpAfter 未設定）を扱うケース
    const tx = createMockTx({
      expEventsInsertReturning: [], // duplicate
      totalExpAfterGrant: 0,
      existingEvent: {
        amount: 42,
        metadata: { score: 10, incorrectAnswers: 0 }, // totalExpAfter 欠落
      },
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).not.toBeNull();
    expect(result?.earnedExp).toBe(42);
    // totalExpAfter が欠けているので amount を使う → totalExp === earnedExp
    expect(result?.totalExp).toBe(42);
  });

  it('重複再取得で metadata が null でも安全にフォールバックする', async () => {
    const tx = createMockTx({
      expEventsInsertReturning: [],
      totalExpAfterGrant: 0,
      existingEvent: {
        amount: 30,
        metadata: null,
      },
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).not.toBeNull();
    expect(result?.earnedExp).toBe(30);
    expect(result?.totalExp).toBe(30);
  });

  it('重複再取得時も levelUp 判定が一貫している（初回と同じ結果）', async () => {
    // 初回: earned 24, totalAfter 200 → levelUp true (getLevel(200)=2, getLevel(176)=1)
    // 重複時: metadata.totalExpAfter=200 でも同じく levelUp=true
    const tx = createMockTx({
      expEventsInsertReturning: [],
      totalExpAfterGrant: 0,
      existingEvent: {
        amount: 24,
        metadata: { totalExpAfter: 200 },
      },
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result?.earnedExp).toBe(24);
    expect(result?.totalExp).toBe(200);
    expect(result?.level).toBe(2);
    expect(result?.levelUp).toBe(true);
  });

  it('重複再取得で既存イベントが空配列の場合はゼロ値の ExpInfo を返す', async () => {
    // 競合 INSERT が 0 件 かつ 既存 SELECT でも行が取れない異常系
    // （現実には発生しない想定だが防御的挙動を検証）
    const tx = createMockTx({
      expEventsInsertReturning: [],
      totalExpAfterGrant: 0,
      // existingEvent 未指定 → select が [] を返す
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, baseParams);

    expect(result).toEqual({
      earnedExp: 0,
      totalExp: 0,
      level: 0,
      levelUp: false,
      progressPercent: 0,
    });
  });

  it('calculateExp が null を返したら（未登録 menuType）付与を完全にスキップする', async () => {
    mockCalculateExp.mockReturnValue(null);
    const tx = createMockTx({
      expEventsInsertReturning: [],
      totalExpAfterGrant: 0,
    });
    const { grantChallengeExp } = await import('./save-exp');

    const result = await grantChallengeExp(tx as never, {
      ...baseParams,
      menuType: 'machi_fu', // 現状ホワイトリストに無い
    });

    expect(result).toBeNull();
    expect(tx.insert).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.select).not.toHaveBeenCalled();
  });
});
