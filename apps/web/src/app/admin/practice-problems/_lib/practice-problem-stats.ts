import { ARCHIVE_KINDS } from "@mahjong-scoring/core";

import { PRACTICE_PROBLEM_SOURCES } from "@/lib/practice-problems/source";

import type { PracticeProblemCountRow } from "./queries";

/** 由来の表の 1 行 */
export interface PracticeProblemStatRow {
  readonly kind: string;
  readonly source: string;
  /** 種別・由来の両方が定数（`ARCHIVE_KINDS` / `PRACTICE_PROBLEM_SOURCES`）にあるか */
  readonly known: boolean;
  readonly total: number;
  readonly inPeriod: number;
  readonly lastSavedAt: Date | null;
}

/** 種別ごとの合計（KPI 用） */
export interface PracticeProblemKindTotal {
  readonly kind: string;
  readonly total: number;
  readonly inPeriod: number;
}

/** 由来の表の行と合計 */
export interface PracticeProblemStats {
  /** `ARCHIVE_KINDS` × `PRACTICE_PROBLEM_SOURCES` の全組（定数の順。0 件も含む）の後ろに、定数に無い組（kind, source の昇順） */
  readonly rows: readonly PracticeProblemStatRow[];
  /** `ARCHIVE_KINDS` の順の種別ごとの合計（KPI 用。定数に無い種別は含めない） */
  readonly kindTotals: readonly PracticeProblemKindTotal[];
  /** 全行の累計の合計（定数に無い行も含む） */
  readonly total: number;
  /** 全行の期間内の合計（定数に無い行も含む） */
  readonly inPeriod: number;
  /** 全行の total の最大（横棒の分母）。全部 0 なら 0 */
  readonly maxTotal: number;
}

/** 種別 × 由来の組を 1 つの文字列キーにする（Map 用。区切りは値に現れない改行） */
function pairKey(kind: string, source: string): string {
  return `${kind}\n${source}`;
}

/** 文字列の昇順の比較（ロケールに依らない） */
function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * DB の保存数を、定数の種別 × 由来に沿った表の行と合計にまとめる
 * 問題保存状況組み立て
 *
 * @design 定数を正とし、0 件の組も 0 として並べる
 * 行の元は DB ではなく `ARCHIVE_KINDS` × `PRACTICE_PROBLEM_SOURCES` の全組み合わせ
 * （種別の順 → 由来の順）。0 件の組（例: android）こそ「届いていない」の答えなので
 * 落とせない。行は 6 つで、並び替えのタブは持たない。
 *
 * @design 定数に無い値の組は捨てずに末尾へ生の値で出す
 * DB にあって定数に無い種別・由来（廃止した種別等）の組は `known: false` の行にして
 * 末尾に kind, source の昇順で並べる。黙って落とすと合計が DB と合わず、原因を
 * 調べる手掛かりも消える。合計（`total` / `inPeriod`）・`maxTotal` もこれらの行を
 * 含める。KPI 用の `kindTotals` は定数の種別だけ（表示名を持たない種別は KPI に出せない）。
 *
 * @param counts - `fetchPracticeProblemCounts` が返した種別 × 由来ごとの保存数
 */
export function buildPracticeProblemStats(
  counts: readonly PracticeProblemCountRow[],
): PracticeProblemStats {
  const countByPair = new Map(
    counts.map((row) => [pairKey(row.kind, row.source), row]),
  );

  const knownRows: PracticeProblemStatRow[] = ARCHIVE_KINDS.flatMap((kind) =>
    PRACTICE_PROBLEM_SOURCES.map((source) => {
      const count = countByPair.get(pairKey(kind, source));
      return {
        kind,
        source,
        known: true,
        total: count?.total ?? 0,
        inPeriod: count?.inPeriod ?? 0,
        lastSavedAt: count?.lastSavedAt ?? null,
      };
    }),
  );

  const knownKinds: ReadonlySet<string> = new Set(ARCHIVE_KINDS);
  const knownSources: ReadonlySet<string> = new Set(PRACTICE_PROBLEM_SOURCES);
  const unknownRows: PracticeProblemStatRow[] = counts
    .filter((row) => !knownKinds.has(row.kind) || !knownSources.has(row.source))
    .map((row) => ({
      kind: row.kind,
      source: row.source,
      known: false,
      total: row.total,
      inPeriod: row.inPeriod,
      lastSavedAt: row.lastSavedAt,
    }))
    .sort(
      (a, b) =>
        compareStrings(a.kind, b.kind) || compareStrings(a.source, b.source),
    );

  const kindTotals: PracticeProblemKindTotal[] = ARCHIVE_KINDS.map((kind) => {
    const rowsOfKind = knownRows.filter((row) => row.kind === kind);
    return {
      kind,
      total: rowsOfKind.reduce((sum, row) => sum + row.total, 0),
      inPeriod: rowsOfKind.reduce((sum, row) => sum + row.inPeriod, 0),
    };
  });

  const rows = [...knownRows, ...unknownRows];
  return {
    rows,
    kindTotals,
    total: rows.reduce((sum, row) => sum + row.total, 0),
    inPeriod: rows.reduce((sum, row) => sum + row.inPeriod, 0),
    maxTotal: rows.reduce((max, row) => Math.max(max, row.total), 0),
  };
}

/**
 * 割合（0〜100 の整数に丸めた %）
 * 割合計算
 *
 * @param count - 当てはまる数
 * @param total - 分母。0 なら割合は無い（undefined）
 */
export function percentOf(count: number, total: number): number | undefined {
  if (total === 0) return undefined;
  return Math.round((count / total) * 100);
}
