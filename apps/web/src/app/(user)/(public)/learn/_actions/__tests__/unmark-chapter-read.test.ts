import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockGetUser, mockDelete, mockWhere, mockRevalidatePath } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockDelete: vi.fn(),
  mockWhere: vi.fn(),
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
    delete: mockDelete,
  },
}));

vi.mock('@/lib/db/schema', () => ({
  learnChapterReads: {
    userId: 'user_id',
    chapterSlug: 'chapter_slug',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => ({ __and: args })),
  eq: vi.fn((column: unknown, value: unknown) => ({ __eq: { column, value } })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}));

import { unmarkChapterRead } from '../unmark-chapter-read';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupDeleteChain() {
  mockWhere.mockResolvedValue(undefined);
  mockDelete.mockReturnValue({ where: mockWhere });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('unmarkChapterRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDeleteChain();
  });

  describe('invalid slug', () => {
    it('returns { ok: false, skipped: "invalid-slug" } for unknown slug', async () => {
      const result = await unmarkChapterRead('not-a-real-chapter');

      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('does not read auth or DB when the slug is invalid', async () => {
      await unmarkChapterRead('bogus');

      expect(mockGetUser).not.toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated user', () => {
    it('returns { ok: false, skipped: "anonymous" } when user is undefined', async () => {
      mockGetUser.mockResolvedValue({ data: { user: undefined } });

      const result = await unmarkChapterRead('jantou-fu');

      expect(result).toEqual({ ok: false, skipped: 'anonymous' });
    });

    it('returns { ok: false, skipped: "anonymous" } when user is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const result = await unmarkChapterRead('jantou-fu');

      expect(result).toEqual({ ok: false, skipped: 'anonymous' });
    });

    it('does not delete or revalidate when unauthenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: undefined } });

      await unmarkChapterRead('jantou-fu');

      expect(mockDelete).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('authenticated success', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    });

    it('returns { ok: true } when unmarking an unread chapter (idempotent)', async () => {
      // DELETE affects 0 rows but the action should still succeed.
      const result = await unmarkChapterRead('jantou-fu');

      expect(result).toEqual({ ok: true });
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('returns { ok: true } when unmarking a read chapter', async () => {
      const result = await unmarkChapterRead('mentsu-fu');

      expect(result).toEqual({ ok: true });
    });

    it('calls delete().where() once for a valid slug', async () => {
      await unmarkChapterRead('machi-fu');

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockWhere).toHaveBeenCalledTimes(1);
    });

    it('revalidates both /learn and /learn/<slug>', async () => {
      await unmarkChapterRead('jantou-fu');

      expect(mockRevalidatePath).toHaveBeenCalledWith('/learn');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/learn/jantou-fu');
    });
  });

  // Task 3(C): 追加エッジケース
  describe('invalid slug variants', () => {
    it('rejects uppercase slug', async () => {
      const result = await unmarkChapterRead('About-This-App');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('rejects slug with underscore', async () => {
      const result = await unmarkChapterRead('jantou_fu');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('rejects empty string', async () => {
      const result = await unmarkChapterRead('');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });

    it('rejects slug with path traversal characters', async () => {
      const result = await unmarkChapterRead('../admin/users');
      expect(result).toEqual({ ok: false, skipped: 'invalid-slug' });
    });
  });
});
