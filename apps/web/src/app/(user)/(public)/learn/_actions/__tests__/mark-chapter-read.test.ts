import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const {
  mockGetUser,
  mockInsert,
  mockValues,
  mockOnConflictDoNothing,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockOnConflictDoNothing: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
  ),
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
  },
}));

vi.mock('@/lib/db/schema', () => ({
  learnChapterReads: {
    userId: 'user_id',
    chapterSlug: 'chapter_slug',
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

import { markChapterRead } from '../mark-chapter-read';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupInsertChain() {
  mockOnConflictDoNothing.mockResolvedValue(undefined);
  mockValues.mockReturnValue({ onConflictDoNothing: mockOnConflictDoNothing });
  mockInsert.mockReturnValue({ values: mockValues });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('markChapterRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupInsertChain();
  });

  describe('invalid slug', () => {
    it('returns { ok: false, skipped: "invalid-slug" } for unknown slug', async () => {
      const result = await markChapterRead('not-a-real-chapter');

      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('does not read auth or DB when the slug is invalid', async () => {
      await markChapterRead('bogus');

      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated user', () => {
    it('returns { ok: false, skipped: "anonymous" } when user is undefined', async () => {
      mockGetUser.mockResolvedValue({ data: { user: undefined } });

      const result = await markChapterRead('jantou-fu');

      expect(result).toEqual({ ok: false, skipped: 'anonymous' });
    });

    it('returns { ok: false, skipped: "anonymous" } when user is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await markChapterRead('jantou-fu');

      expect(result).toEqual({ ok: false, skipped: 'anonymous' });
    });

    it('does not insert or revalidate when unauthenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: undefined } });

      await markChapterRead('jantou-fu');

      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('authenticated success', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    });

    it('returns { ok: true } for a valid slug', async () => {
      const result = await markChapterRead('jantou-fu');

      expect(result).toEqual({ ok: true });
    });

    it('inserts with the authenticated user id and chapter slug', async () => {
      await markChapterRead('mentsu-fu');

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledWith({
        userId: 'user-123',
        chapterSlug: 'mentsu-fu',
      });
      expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(1);
    });

    it('revalidates both /learn and /learn/<slug>', async () => {
      await markChapterRead('machi-fu');

      expect(mockRevalidatePath).toHaveBeenCalledWith('/learn');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/learn/machi-fu');
    });

    it('returns { ok: true } on duplicate calls (ON CONFLICT DO NOTHING)', async () => {
      const first = await markChapterRead('jantou-fu');
      const second = await markChapterRead('jantou-fu');

      expect(first).toEqual({ ok: true });
      expect(second).toEqual({ ok: true });
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });
  });

  // Task 3(C): 追加エッジケース
  describe('invalid slug variants', () => {
    it('rejects uppercase slug (CHECK 制約違反フォーマット)', async () => {
      const result = await markChapterRead('About-This-App');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('rejects slug with underscore', async () => {
      const result = await markChapterRead('jantou_fu');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('rejects slug with leading hyphen', async () => {
      const result = await markChapterRead('-jantou-fu');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('rejects empty string', async () => {
      const result = await markChapterRead('');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('rejects slug with whitespace', async () => {
      const result = await markChapterRead(' jantou-fu ');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('rejects slug with path traversal characters', async () => {
      const result = await markChapterRead('../admin/users');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });
  });
});
