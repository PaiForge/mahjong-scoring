import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockGetUser, mockSelect, mockFrom, mockWhere, mockLimit } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockWhere: vi.fn(),
  mockLimit: vi.fn(),
}));

// Mock the Supabase server client
vi.mock('../../../../lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    }),
  ),
}));

// Mock the DB module
vi.mock('../../../../lib/db', () => ({
  db: {
    select: mockSelect,
  },
  userRoles: { userId: 'user_id' },
}));

// Mock drizzle-orm eq function
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}));

import { requireAdmin } from '../auth';

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up the default chain: db.select().from().where().limit()
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ limit: mockLimit });
  });

  describe('authenticated admin user', () => {
    it('returns userId on success', async () => {
      const userId = 'user-123';
      mockGetUser.mockResolvedValue({
        data: { user: { id: userId } },
      });
      mockLimit.mockResolvedValue([{ userId, role: 'admin' }]);

      const result = await requireAdmin();

      expect(result).toEqual({ userId });
    });
  });

  describe('unauthenticated user', () => {
    it('returns error when user is not logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: undefined },
      });

      const result = await requireAdmin();

      expect(result).toEqual({ error: 'unauthorized' });
    });

    it('returns error when user is null', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await requireAdmin();

      expect(result).toEqual({ error: 'unauthorized' });
    });
  });

  describe('authenticated but non-admin user', () => {
    it('returns error when user has "user" role', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-456' } },
      });
      mockLimit.mockResolvedValue([{ userId: 'user-456', role: 'user' }]);

      const result = await requireAdmin();

      expect(result).toEqual({ error: 'unauthorized' });
    });

    it('returns error when user has no role record at all', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-789' } },
      });
      mockLimit.mockResolvedValue([]);

      const result = await requireAdmin();

      expect(result).toEqual({ error: 'unauthorized' });
    });
  });

  describe('DB query is called correctly for authenticated users', () => {
    it('queries the userRoles table with the correct userId', async () => {
      const userId = 'user-abc';
      mockGetUser.mockResolvedValue({
        data: { user: { id: userId } },
      });
      mockLimit.mockResolvedValue([{ userId, role: 'admin' }]);

      await requireAdmin();

      expect(mockSelect).toHaveBeenCalledOnce();
      expect(mockFrom).toHaveBeenCalledOnce();
      expect(mockWhere).toHaveBeenCalledOnce();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('does not query DB when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: undefined },
      });

      await requireAdmin();

      expect(mockSelect).not.toHaveBeenCalled();
    });
  });
});
