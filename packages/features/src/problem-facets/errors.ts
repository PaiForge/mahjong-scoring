/**
 * 保存問題の属性を計算できない理由
 * 問題属性計算エラー
 *
 * 型と定数だけのモジュール。web の DB スキーマ（drizzle-kit が CommonJS で読む）が
 * CHECK 制約の許容値に使うので、採点ライブラリを引くモジュールを import しない。
 */
import { ARCHIVE_REBUILD_ERRORS } from "@mahjong-scoring/core/problem/archive/types";

/**
 * 属性の計算に失敗した理由の一覧（`practice_problem_facet_sets.error` の許容値）
 *
 * - 盤面の組み立て直しの失敗（`ArchiveRebuildError`）: 標準ルールで問題に組み立てられない。
 *   保存形式として読めない盤面（未知の種別・版・形）も `invalidPayload` に寄せる
 * - `unmappedYaku`: 組み立てられたが、内訳に永続化用の役 ID へ写せない役名がある。
 *   名前のまま保存すると後から読めない値が残るので、行を作らず失敗として記録する
 *
 * 値は追加だけを許す（保存済みの行が読めなくなる）。足したら CHECK 制約を作り直す
 * マイグレーションが要る。
 */
export const PROBLEM_FACET_ERRORS = [
  ...ARCHIVE_REBUILD_ERRORS,
  "unmappedYaku",
] as const;

/**
 * 属性の計算に失敗した理由
 * 問題属性計算エラー
 */
export type ProblemFacetError = (typeof PROBLEM_FACET_ERRORS)[number];
