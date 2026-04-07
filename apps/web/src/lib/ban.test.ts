import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('./db', () => {
  const selectResult = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  return {
    db: {
      select: vi.fn(() => selectResult),
    },
    profiles: {
      id: 'id',
      bannedAt: 'banned_at',
    },
    __selectResult: selectResult,
  };
});

import { isUserBanned } from './ban';
import * as dbModule from './db';

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- test helper to access mock internals
const mockSelectResult = (dbModule as Record<string, unknown>).__selectResult as {
  limit: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isUserBanned', () => {
  it('returns false when no profile is found', async () => {
    mockSelectResult.limit.mockResolvedValue([]);
    expect(await isUserBanned('unknown-user')).toBe(false);
  });

  it('returns false when bannedAt is null', async () => {
    mockSelectResult.limit.mockResolvedValue([{ bannedAt: undefined }]);
    expect(await isUserBanned('user-1')).toBe(false);
  });

  it('returns true when bannedAt is a date', async () => {
    mockSelectResult.limit.mockResolvedValue([
      { bannedAt: new Date('2026-01-01') },
    ]);
    expect(await isUserBanned('user-2')).toBe(true);
  });
});
