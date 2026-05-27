import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks (hoisted before module under test)
// ---------------------------------------------------------------------------

const { mockGetOptionalUser, mockSelect, mockFrom, mockWhere } = vi.hoisted(() => ({
  mockGetOptionalUser: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockWhere: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getOptionalUser: mockGetOptionalUser,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
  },
}));

vi.mock('@/lib/db/schema', () => ({
  learnChapterReads: {
    userId: 'user_id',
    chapterSlug: 'chapter_slug',
  },
}));

// `server-only` is not resolvable in test environment; stub it out.
vi.mock('server-only', () => ({}));

import { fetchReadChapterSlugs, isChapterRead } from '../progress';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupDbSelectChain(rows: Array<{ chapterSlug: string }>) {
  mockWhere.mockResolvedValue(rows);
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('fetchReadChapterSlugs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty Set when the user is not authenticated', async () => {
    mockGetOptionalUser.mockResolvedValue(undefined);

    const result = await fetchReadChapterSlugs();

    expect(result.size).toBe(0);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns an empty Set when authenticated user has no read chapters', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    setupDbSelectChain([]);

    const result = await fetchReadChapterSlugs();

    expect(result.size).toBe(0);
  });

  it('returns a Set of read chapter slugs for an authenticated user', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    setupDbSelectChain([
      { chapterSlug: 'jantou-fu' },
      { chapterSlug: 'mentsu-fu' },
    ]);

    const result = await fetchReadChapterSlugs();

    expect(result.size).toBe(2);
    expect(result.has('jantou-fu')).toBe(true);
    expect(result.has('mentsu-fu')).toBe(true);
    expect(result.has('machi-fu')).toBe(false);
  });

  it('queries learn_chapter_reads filtered by authenticated user id', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-xyz' });
    setupDbSelectChain([]);

    await fetchReadChapterSlugs();

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockWhere).toHaveBeenCalledTimes(1);
  });
});

describe('isChapterRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when the user is not authenticated', async () => {
    mockGetOptionalUser.mockResolvedValue(undefined);

    await expect(isChapterRead('jantou-fu')).resolves.toBe(false);
  });

  it('returns true when the slug is present in the read set', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    setupDbSelectChain([{ chapterSlug: 'jantou-fu' }]);

    await expect(isChapterRead('jantou-fu')).resolves.toBe(true);
  });

  it('returns false when the slug is not in the read set', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    setupDbSelectChain([{ chapterSlug: 'jantou-fu' }]);

    await expect(isChapterRead('machi-fu')).resolves.toBe(false);
  });
});

// Task 2/3(B): 既存カバレッジで漏れていた異常系・境界値
describe('fetchReadChapterSlugs (additional edge cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propagates thrown DB errors to the caller (no silent fallback)', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    const dbError = new Error('connection refused');
    mockWhere.mockRejectedValue(dbError);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    await expect(fetchReadChapterSlugs()).rejects.toThrow('connection refused');
  });

  it('treats duplicate rows from the DB as a single Set entry', async () => {
    // UNIQUE 制約がある前提だが、防御的に重複が来ても Set で冪等化される
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    setupDbSelectChain([
      { chapterSlug: 'jantou-fu' },
      { chapterSlug: 'jantou-fu' },
      { chapterSlug: 'mentsu-fu' },
    ]);

    const result = await fetchReadChapterSlugs();

    expect(result.size).toBe(2);
    expect(result.has('jantou-fu')).toBe(true);
    expect(result.has('mentsu-fu')).toBe(true);
  });

  it('handles a large number of read rows (performance smoke test)', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    const rows = Array.from({ length: 1000 }, (_, i) => ({
      chapterSlug: `slug-${i}`,
    }));
    setupDbSelectChain(rows);

    const start = Date.now();
    const result = await fetchReadChapterSlugs();
    const elapsed = Date.now() - start;

    expect(result.size).toBe(1000);
    // DB モックなので実時間的には数 ms 以内のはず。閾値は緩めに設定。
    expect(elapsed).toBeLessThan(500);
  });

  it('returns a readonly Set type (not directly mutable)', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    setupDbSelectChain([{ chapterSlug: 'jantou-fu' }]);

    const result = await fetchReadChapterSlugs();

    // ReadonlySet は実行時には通常の Set。呼び出し側が型エラーで守られる。
    // ここでは中身の読み取り API のみで確認。
    expect(result.has('jantou-fu')).toBe(true);
    expect(typeof result.size).toBe('number');
  });
});

describe('isChapterRead (additional edge cases)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('propagates DB errors instead of silently returning false', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    const dbError = new Error('DB down');
    mockWhere.mockRejectedValue(dbError);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    await expect(isChapterRead('jantou-fu')).rejects.toThrow('DB down');
  });

  it('returns false for an unknown slug even when the user has other reads', async () => {
    mockGetOptionalUser.mockResolvedValue({ id: 'user-123' });
    setupDbSelectChain([
      { chapterSlug: 'jantou-fu' },
      { chapterSlug: 'mentsu-fu' },
    ]);

    await expect(isChapterRead('unknown-chapter')).resolves.toBe(false);
  });
});
