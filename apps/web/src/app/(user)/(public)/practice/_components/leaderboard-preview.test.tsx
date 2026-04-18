import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardPreview } from './leaderboard-preview';
import type { LeaderboardRow } from '@/app/(user)/(public)/leaderboard/_lib/types';

vi.mock('next-intl/server', () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock('@/app/(user)/(public)/leaderboard/_components/leaderboard-table-header', () => ({
  LeaderboardTableHeader: () => (
    <thead>
      <tr>
        <th>header</th>
      </tr>
    </thead>
  ),
}));

vi.mock('@/app/(user)/(public)/leaderboard/_components/leaderboard-table-row', () => ({
  LeaderboardTableRow: ({ row }: { readonly row: LeaderboardRow }) => (
    <tr data-testid={`row-${row.userId}`}>
      <td>{row.username}</td>
    </tr>
  ),
}));

function createRow(overrides: Partial<LeaderboardRow> = {}): LeaderboardRow {
  return {
    userId: 'user-1',
    username: 'player1',
    score: 100,
    incorrectAnswers: 0,
    timeTaken: 30,
    displayName: undefined,
    avatarUrl: undefined,
    rank: 1,
    ...overrides,
  } as LeaderboardRow;
}

describe('LeaderboardPreview', () => {
  it('returns undefined when rows is empty', async () => {
    const { container } = render(
      await LeaderboardPreview({ rows: [], detailPath: '/leaderboard/all-time/jantou-fu' }),
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders table with rows when rows are provided', async () => {
    const rows = [
      createRow({ userId: 'u1', username: 'Alice', rank: 1 }),
      createRow({ userId: 'u2', username: 'Bob', rank: 2 }),
      createRow({ userId: 'u3', username: 'Carol', rank: 3 }),
    ];

    render(
      await LeaderboardPreview({ rows, detailPath: '/leaderboard/all-time/jantou-fu' }),
    );

    expect(screen.getByTestId('row-u1')).toBeDefined();
    expect(screen.getByTestId('row-u2')).toBeDefined();
    expect(screen.getByTestId('row-u3')).toBeDefined();
  });

  it('renders section title with allTimeRanking key', async () => {
    const rows = [createRow()];

    render(
      await LeaderboardPreview({ rows, detailPath: '/leaderboard/all-time/jantou-fu' }),
    );

    expect(screen.getByText('allTimeRanking')).toBeDefined();
  });

  it('renders a link to the detail page with viewMore key', async () => {
    const detailPath = '/leaderboard/all-time/mentsu-fu';
    const rows = [createRow()];

    render(await LeaderboardPreview({ rows, detailPath }));

    const link = screen.getByText('viewMore');
    expect(link.closest('a')?.getAttribute('href')).toBe(detailPath);
  });

  it('renders exactly the number of rows passed', async () => {
    const rows = [
      createRow({ userId: 'u1', rank: 1 }),
      createRow({ userId: 'u2', rank: 2 }),
    ];

    render(
      await LeaderboardPreview({ rows, detailPath: '/leaderboard/all-time/jantou-fu' }),
    );

    expect(screen.getAllByTestId(/^row-/)).toHaveLength(2);
  });
});
