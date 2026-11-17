/**
 * ローカル開発用の保存問題の投入
 * 保存問題シード
 *
 * 本日の問題（`src/lib/daily-problem/today.ts`）は `practice_problems` の行から
 * 選ぶ。手元の DB は空なので、そのままではダッシュボードの本日の問題が出ない。
 * 本日の問題の候補になる和了形の盤面（どのルール設定でも正解が同じで、役満でない
 * 手）を固定で入れ、ログインするだけで確かめられるようにする。
 *
 * - 盤面は乱数に依らない固定値。どれも保存の検証と本日の問題の適格判定を通る
 *   （`practice-problems.test.ts` が固定する）
 * - `created_at` は前日以前（当日に保存した行は候補にならないため）
 * - `source` は `web`。`content_hash` は本番の保存（`src/lib/practice-problems/archive.ts`）と
 *   同じ計算（`archiveIdentityInput` の SHA-256）の結果で、練習で同じ盤面を保存しても
 *   1 行に収まる。計算せずに値で持つのは、このスクリプトを動かす tsx（CommonJS）が
 *   core の index の引く ESM 専用のライブラリを読めないため。値が計算と一致することは
 *   テストが確かめる
 * - 冪等: 同じ盤面が既にあれば何もしない（`ON CONFLICT DO NOTHING`）。消して入れ直さない —
 *   本日の問題に使った行は `daily_problems` が参照していて消せない。すべて出し切ったら
 *   その日から「問題なし」になる（練習で保存した盤面も候補になる）
 */
// index ではなく定数だけのモジュールを読む（理由はモジュールの説明）
import {
  ARCHIVE_IDENTITY_VERSION,
  ARCHIVE_SCHEMA_VERSION,
  type AgariProblemPayload,
} from "@mahjong-scoring/core/problem/archive/types";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import {
  practiceProblems,
  type NewPracticeProblem,
} from "../../src/lib/db/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * シードの保存問題 1 行
 */
export interface SeedDailyProblem {
  /** 同一性の入力（`archiveIdentityInput`）の SHA-256 */
  readonly contentHash: string;
  /** 保存の検証で正規化した後の形の盤面 */
  readonly payload: AgariProblemPayload;
}

/**
 * 本日の問題の候補になる和了形の盤面（牌種 ID。0〜8 萬子・9〜17 筒子・18〜26 索子・
 * 27〜30 東南西北・31〜33 白發中）
 *
 * 符・翻・ツモ / ロン・副露・リーチの有無がばらけるように選んである。
 */
export const SEED_DAILY_PROBLEMS: readonly SeedDailyProblem[] = [
  {
    contentHash:
      "9534cb25f2377b4ae933ea0f1975a523d85237c4ede4eee7f079d0a4c9fd795c",
    payload: {
      hand: {
        closed: [3, 3, 12, 13, 14, 20, 21, 22],
        exposed: [
          { type: "chi", hais: [5, 6, 7], nakiHai: 5 },
          { type: "chi", hais: [22, 23, 24], nakiHai: 22 },
        ],
      },
      agariHai: 3,
      isTsumo: true,
      jikaze: 28,
      bakaze: 28,
      doraMarkers: [19],
      riichi: null,
    },
  },
  {
    contentHash:
      "56544e1b567ade919ba3f186d8ceb215712530d69e91e700d3bf54a270ed9e17",
    payload: {
      hand: {
        closed: [0, 1, 2, 18, 19, 19, 20, 20, 21, 22, 23, 24, 26, 26],
        exposed: [],
      },
      agariHai: 24,
      isTsumo: false,
      jikaze: 27,
      bakaze: 27,
      doraMarkers: [28],
      riichi: null,
    },
  },
  {
    contentHash:
      "295e16e96c826583fe18a4978222b00caffc382aa0d9e5415bfa94580b45e354",
    payload: {
      hand: {
        closed: [4, 4, 17, 17, 17, 22, 22, 22, 24, 24, 24],
        exposed: [{ type: "daiminkan", hais: [9, 9, 9, 9], from: "kamicha" }],
      },
      agariHai: 22,
      isTsumo: false,
      jikaze: 28,
      bakaze: 28,
      doraMarkers: [21, 0],
      riichi: null,
    },
  },
  {
    contentHash:
      "cec5c77e681e18409ede6ee887b9a52812bedb009c1f6382cd5cad56d55bf157",
    payload: {
      hand: {
        closed: [0, 1, 2, 6, 6, 13, 14, 15, 33, 33, 33],
        exposed: [{ type: "chi", hais: [15, 16, 17], nakiHai: 15 }],
      },
      agariHai: 6,
      isTsumo: true,
      jikaze: 27,
      bakaze: 27,
      doraMarkers: [15],
      riichi: null,
    },
  },
  {
    contentHash:
      "0cfd89f1fb0edc3bb8d8c06e608b89f2a5311576ad607232f36b9a80b2fed089",
    payload: {
      hand: {
        closed: [1, 1, 6, 7, 8, 12, 13, 14, 19, 19, 19, 21, 22, 23],
        exposed: [],
      },
      agariHai: 22,
      isTsumo: true,
      jikaze: 29,
      bakaze: 27,
      doraMarkers: [32],
      riichi: { uraDoraMarkers: [23] },
    },
  },
  {
    contentHash:
      "c6678516a9007291b5d4001dcac98ec2d79a353e14bec8ff14938214be89473c",
    payload: {
      hand: {
        closed: [4, 4, 4, 5, 5, 5, 9, 9, 9, 21, 21, 24, 24, 24],
        exposed: [],
      },
      agariHai: 5,
      isTsumo: false,
      jikaze: 28,
      bakaze: 28,
      doraMarkers: [24],
      riichi: null,
    },
  },
  {
    contentHash:
      "eb9bd2c49f8e3509ca73392f9ffcbaac29e048976eff0bfbb4fdaa3d0270f5e1",
    payload: {
      hand: {
        closed: [6, 7, 8, 10, 10, 10, 11, 12, 17, 17, 17, 31, 31, 31],
        exposed: [],
      },
      agariHai: 12,
      isTsumo: false,
      jikaze: 27,
      bakaze: 28,
      doraMarkers: [2],
      riichi: { uraDoraMarkers: [6] },
    },
  },
  {
    contentHash:
      "2ebda61f2d965452bb610740b13864bdccbd55cb63f8e76c7040b10715f90e25",
    payload: {
      hand: {
        closed: [2, 3, 4, 11, 12, 13, 13, 13, 22, 23, 24],
        exposed: [{ type: "pon", hais: [33, 33, 33], from: "kamicha" }],
      },
      agariHai: 22,
      isTsumo: true,
      jikaze: 28,
      bakaze: 27,
      doraMarkers: [5],
      riichi: null,
    },
  },
  {
    contentHash:
      "fc0a080d3528bc604e87223e6e175913f04622cbe4b5fb088307d6a288fd4774",
    payload: {
      hand: {
        closed: [0, 0, 0, 6, 7, 7, 7, 7, 8, 12, 12, 12, 19, 19],
        exposed: [],
      },
      agariHai: 12,
      isTsumo: true,
      jikaze: 28,
      bakaze: 27,
      doraMarkers: [9],
      riichi: { uraDoraMarkers: [31] },
    },
  },
  {
    contentHash:
      "7bf536150993c0f8f75a316c256e2ef31064b60daa9b24cb5597b5dd9b1fe7eb",
    payload: {
      hand: {
        closed: [1, 2, 3, 14, 15, 16, 19, 19, 19, 22, 22, 26, 26, 26],
        exposed: [],
      },
      agariHai: 2,
      isTsumo: true,
      jikaze: 29,
      bakaze: 27,
      doraMarkers: [25],
      riichi: null,
    },
  },
  {
    contentHash:
      "44e6003a029fd312eefc69bdf7ad725e5eccf1751698e0aebc3c0ef5dcb2ff3c",
    payload: {
      hand: {
        closed: [1, 2, 3, 4, 5, 6, 10, 11, 12, 12, 12, 31, 31, 31],
        exposed: [],
      },
      agariHai: 6,
      isTsumo: true,
      jikaze: 27,
      bakaze: 28,
      doraMarkers: [9],
      riichi: null,
    },
  },
];

/**
 * 本日の問題の候補になる保存問題を入れる（同じ盤面があれば何もしない）
 * 保存問題投入
 *
 * @param now - 基準の時刻。`created_at` は i 番目の盤面を `now` の (i + 1) 日前にする
 * @returns 宣言した盤面の数（既にあった行も数える）
 */
export async function seedPracticeProblems<
  TSchema extends Record<string, unknown>,
>(db: PostgresJsDatabase<TSchema>, now: Date = new Date()): Promise<number> {
  const rows: NewPracticeProblem[] = SEED_DAILY_PROBLEMS.map(
    ({ contentHash, payload }, index) => ({
      kind: "agari-score",
      schemaVersion: ARCHIVE_SCHEMA_VERSION,
      identityVersion: ARCHIVE_IDENTITY_VERSION,
      contentHash,
      payload,
      source: "web",
      createdAt: new Date(now.getTime() - (index + 1) * DAY_MS),
    }),
  );
  await db
    .insert(practiceProblems)
    .values(rows)
    .onConflictDoNothing({
      target: [
        practiceProblems.kind,
        practiceProblems.identityVersion,
        practiceProblems.contentHash,
      ],
    });
  return rows.length;
}
