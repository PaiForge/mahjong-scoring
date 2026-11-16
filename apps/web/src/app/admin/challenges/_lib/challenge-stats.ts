import {
  isExamMenuType,
  practiceMenuByType,
  PRACTICE_MENU_TYPES,
  type PracticeMenuDescriptor,
} from "@mahjong-scoring/features/practice-menu-types";

import type { ChallengeCountRow } from "./queries";

/**
 * チャレンジの実施状況の並び順
 * 実施状況の並び順
 *
 * - `registry` — レジストリ順（既定）。練習一覧と同じ並びで「どれが挑戦されていないか」に答える
 * - `total` — 累計の多い順。「どれが挑戦されてきたか」に答える
 * - `period` — 期間内の多い順。「最近どれが挑戦されているか」に答える
 *
 * @design 並びは URL の `sort` で切り替える
 * 画面では既存の `AdminTabs`（リンク）で選ぶ。共有した URL や再読み込みで同じ並びに
 * 戻れるようにするため（レッスンの完了状況と同じ）。多い順で同数のときはレジストリ順に
 * 並べる（並びを毎回同じにする）。
 */
export const CHALLENGE_STATS_SORTS = ["registry", "total", "period"] as const;
export type ChallengeStatsSort = (typeof CHALLENGE_STATS_SORTS)[number];

/** 表の 1 行 */
export interface ChallengeStatRow {
  /** `challenge_results.menu_type` の値 */
  readonly menuType: string;
  /** レジストリの練習。undefined は表に載せる練習に無い menu_type（廃止した練習等） */
  readonly practice: PracticeMenuDescriptor | undefined;
  readonly total: number;
  readonly inPeriod: number;
  readonly challengersInPeriod: number;
}

/** 表に出す行と合計 */
export interface ChallengeStats {
  /** レジストリの練習（並びは sort）の後ろに、それ以外の menu_type（昇順）が続く */
  readonly rows: readonly ChallengeStatRow[];
  /** 全行の total の最大（横棒の分母）。全部 0 なら 0 */
  readonly maxTotal: number;
  readonly totalChallenges: number;
  readonly periodChallenges: number;
}

/**
 * 表に載せる練習（レジストリ順）。昇級試験はレジストリにあるが記録を残さない
 * （`challenge_results` に入らない）ので、常に 0 の行を並べないよう除く
 */
const LISTED_PRACTICES: readonly PracticeMenuDescriptor[] =
  PRACTICE_MENU_TYPES.filter((menuType) => !isExamMenuType(menuType)).map(
    (menuType) => practiceMenuByType(menuType),
  );

/**
 * レジストリ順の番号（1 始まり）。並び順を変えても同じ練習は同じ番号
 * レジストリ順番号
 *
 * @param practice - レジストリの練習。undefined（表に載せる練習に無い menu_type）には番号が無い
 */
export function registryPositionOf(
  practice: PracticeMenuDescriptor | undefined,
): number | undefined {
  if (practice === undefined) return undefined;
  const index = LISTED_PRACTICES.findIndex(
    (listed) => listed.menuType === practice.menuType,
  );
  return index === -1 ? undefined : index + 1;
}

/**
 * DB のチャレンジの回数を、レジストリの練習に沿った表の行と合計にまとめる
 * チャレンジ実施状況組み立て
 *
 * @design レジストリを正とし、0 回の練習も 0 として並べる
 * 0 回の練習こそ「挑戦されていない」の答えなので落とせない。行の元は DB ではなく
 * `PRACTICE_MENU_REGISTRY`（練習一覧・URL・辞書の正典）で、DB に行が無い練習は 0 にする。
 * 練習名・リンク先もレジストリから引けるので、行の並びと表示が練習一覧と食い違わない。
 *
 * @design 表に載せる練習に無い menu_type の行は捨てずに末尾へ出す
 * DB にあってレジストリに無い menu_type（廃止・改名した練習等）は `practice: undefined`
 * の行にして、並び順に関わらず末尾に menu_type の昇順で並べる。黙って落とすと合計が
 * DB と合わず、原因を調べる手掛かりも消える。昇級試験の menu_type も表の練習には
 * 載せないが、もし DB に行があれば同じく末尾に出す（記録を残さない前提が崩れたことが
 * 見える）。合計（`totalChallenges` / `periodChallenges`）・`maxTotal` もこれらの行を含める。
 *
 * @param counts - `fetchChallengeCounts` が返した練習ごとの回数
 * @param sort - 並び順
 */
export function buildChallengeStats(
  counts: readonly ChallengeCountRow[],
  sort: ChallengeStatsSort,
): ChallengeStats {
  const countByMenuType = new Map(counts.map((row) => [row.menuType, row]));

  const practiceRows: ChallengeStatRow[] = LISTED_PRACTICES.map((practice) => {
    const count = countByMenuType.get(practice.menuType);
    return {
      menuType: practice.menuType,
      practice,
      total: count?.total ?? 0,
      inPeriod: count?.inPeriod ?? 0,
      challengersInPeriod: count?.challengersInPeriod ?? 0,
    };
  });
  if (sort !== "registry") {
    const key = sort === "total" ? "total" : "inPeriod";
    // Array.prototype.sort は安定なので、同数は元のレジストリ順のまま残る
    practiceRows.sort((a, b) => b[key] - a[key]);
  }

  const listedMenuTypes: ReadonlySet<string> = new Set(
    LISTED_PRACTICES.map((practice) => practice.menuType),
  );
  const unknownRows: ChallengeStatRow[] = counts
    .filter((row) => !listedMenuTypes.has(row.menuType))
    .map((row) => ({
      menuType: row.menuType,
      practice: undefined,
      total: row.total,
      inPeriod: row.inPeriod,
      challengersInPeriod: row.challengersInPeriod,
    }))
    .sort((a, b) =>
      a.menuType < b.menuType ? -1 : a.menuType > b.menuType ? 1 : 0,
    );

  const rows = [...practiceRows, ...unknownRows];
  return {
    rows,
    maxTotal: rows.reduce((max, row) => Math.max(max, row.total), 0),
    totalChallenges: rows.reduce((sum, row) => sum + row.total, 0),
    periodChallenges: rows.reduce((sum, row) => sum + row.inPeriod, 0),
  };
}
