import { describe, expect, it } from 'vitest';
import { getPaginationData, DEFAULT_PAGE_SIZE } from '../pagination';

describe('getPaginationData', () => {
  describe('default pageSize', () => {
    it('returns correct data for page 1', () => {
      const result = getPaginationData(1, 100);
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 5,
        limit: DEFAULT_PAGE_SIZE,
        offset: 0,
      });
    });

    it('returns correct data for a middle page', () => {
      const result = getPaginationData(3, 100);
      expect(result).toEqual({
        currentPage: 3,
        totalPages: 5,
        limit: DEFAULT_PAGE_SIZE,
        offset: 40,
      });
    });

    it('returns correct data for the last page', () => {
      const result = getPaginationData(5, 100);
      expect(result).toEqual({
        currentPage: 5,
        totalPages: 5,
        limit: DEFAULT_PAGE_SIZE,
        offset: 80,
      });
    });
  });

  describe('custom pageSize', () => {
    it('uses the provided pageSize for limit and offset', () => {
      const result = getPaginationData(2, 30, 10);
      expect(result).toEqual({
        currentPage: 2,
        totalPages: 3,
        limit: 10,
        offset: 10,
      });
    });

    it('calculates totalPages correctly with non-divisible count', () => {
      const result = getPaginationData(1, 25, 10);
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 3,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('page clamping to minimum of 1', () => {
    it('clamps page=0 to 1', () => {
      const result = getPaginationData(0, 50);
      expect(result.currentPage).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('clamps page=-1 to 1', () => {
      const result = getPaginationData(-1, 50);
      expect(result.currentPage).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('clamps page=-100 to 1', () => {
      const result = getPaginationData(-100, 50);
      expect(result.currentPage).toBe(1);
      expect(result.offset).toBe(0);
    });
  });

  describe('totalCount=0', () => {
    it('returns totalPages=1 when there are no items', () => {
      const result = getPaginationData(1, 0);
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 1,
        limit: DEFAULT_PAGE_SIZE,
        offset: 0,
      });
    });
  });

  describe('totalCount=1', () => {
    it('returns totalPages=1 for a single item', () => {
      const result = getPaginationData(1, 1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('totalCount exactly equal to pageSize', () => {
    it('returns totalPages=1 when count equals pageSize', () => {
      const result = getPaginationData(1, 10, 10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('totalCount one more than pageSize', () => {
    it('returns totalPages=2 when count is pageSize+1', () => {
      const result = getPaginationData(1, 11, 10);
      expect(result.totalPages).toBe(2);
    });
  });

  describe('page beyond totalPages', () => {
    it('does not clamp page to totalPages (offset may exceed data)', () => {
      const result = getPaginationData(10, 5, 5);
      expect(result.currentPage).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.offset).toBe(45);
    });
  });

  describe('DEFAULT_PAGE_SIZE export', () => {
    it('is 20', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(20);
    });
  });
});
