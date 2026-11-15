/**
 * 出題した問題の保存（web とアプリの入口が共有する本体）
 * 問題保存サービス
 *
 * @description
 * 和了形・聴牌形の点数計算（`agari-score` / `tenpai-score`）で出した問題の盤面を、
 * 表 `practice_problems` に同じ盤面 1 行で貯める。入口は web の
 * `POST /api/practice-problems`（cookie 認証）とアプリの
 * `POST /api/mobile/v1/practice-problems`（Bearer）の 2 つで、どちらも認証と
 * 回数の枠を通してからここを呼ぶ。
 *
 * @design 対象はログイン済みの利用者の実践練習 2 種だけ
 * 匿名の利用者の出題は保存しない。匿名の無料枠は各練習 1 問/日で失う量が小さく、
 * 匿名の書き込み口を作らずに済む。ユーザー名を決める前の利用者は保存してよい
 * （盤面は利用者に紐づけない）。BAN 中・退会処理中は入口の認証
 * （`authorizeApiRequest` / `authorizeMobileRequest`）が弾く。模試・レッスン・
 * お試し・デモは別の生成経路で、ここへは届かない。
 *
 * @design 停止スイッチ（`PRACTICE_PROBLEM_ARCHIVE_DISABLED=1`）
 * 収集を止めたいときは環境変数を `1` にする（{@link isPracticeProblemArchiveDisabled}）。
 * 入口は最初にこれを見て、認証も保存もせず 204 を返す。クライアントは応答の中身を
 * 使わないので専用の応答は要らず、5xx を返すと再送を誘発する。停止中は認証サーバーへの
 * 問い合わせも省く。
 */
import "server-only";

import { createHash } from "node:crypto";

import {
  archiveIdentityInput,
  parsePracticeProblemArchiveRequest,
  ARCHIVE_IDENTITY_VERSION,
  type ArchiveValidationError,
} from "@mahjong-scoring/core";

import { db, practiceProblems } from "../db";
import { extractPgErrorCode } from "../db/extract-pg-error-code";
import { logExternalError } from "../log-error";

import type { PracticeProblemSource } from "./source";

/**
 * 保存の要求本文の上限（UTF-8 のバイト数）
 *
 * 盤面は牌 14 枚前後と少数の項目で、両種別の最大構成（副露 4 つすべて槓・
 * 表ドラ 5 枚、門前リーチで暗槓 4 つ・裏ドラ 5 枚）でも 1KB に届かない
 * （`archive.test.ts` で最大構成が収まることを固定する）。上限を超えた本文は
 * 読まずに 400 にする。
 */
export const PRACTICE_PROBLEM_ARCHIVE_BODY_MAX_BYTES = 4096;

/**
 * 問題の保存を止めているか
 * 問題保存停止判定
 *
 * 環境変数 `PRACTICE_PROBLEM_ARCHIVE_DISABLED` が `"1"` のときだけ止める。
 * 入口はこれが真なら認証の前に 204 を返す（理由はモジュールの説明）。
 */
export function isPracticeProblemArchiveDisabled(): boolean {
  return process.env.PRACTICE_PROBLEM_ARCHIVE_DISABLED === "1";
}

/**
 * 問題の保存に失敗した理由
 * 問題保存エラー
 *
 * - `invalid`: 要求が検証を通らなかった（理由は `reason`。入口は 400）
 * - `saveFailed`: DB への書き込みが失敗した（入口は 500。同じ要求を送り直してよい）
 */
export type ArchivePracticeProblemError =
  | { readonly type: "invalid"; readonly reason: ArchiveValidationError }
  | { readonly type: "saveFailed" };

/** {@link archivePracticeProblem} の結果。保存済み（新規でも既存でも同じ）か、失敗の理由 */
export type ArchivePracticeProblemResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: ArchivePracticeProblemError };

/** 同一性の入力の SHA-256（16 進 64 文字） */
function contentHashOf(identityInput: string): string {
  return createHash("sha256").update(identityInput, "utf8").digest("hex");
}

/**
 * 未知の本文を検証し、同じ盤面が無ければ 1 行保存する
 * 問題保存
 *
 * 検証（`parsePracticeProblemArchiveRequest`）→ 同一性の入力
 * （`archiveIdentityInput`）→ SHA-256 → `INSERT ... ON CONFLICT
 * (kind, identity_version, content_hash) DO NOTHING` の 1 回で終える。
 *
 * @design 正規化とハッシュはサーバーが行い、保存は ON CONFLICT DO NOTHING の 1 回
 * クライアントのハッシュは信頼しない（本文に持たせない）。事前の SELECT をせず
 * 一意制約に任せるので、再送・並行保存・応答が消えた後の再送が 1 行に収まる。
 * 新規か既存かを呼び出し側に返さない（入口はどちらも 204）。ハッシュの計算
 * （Node の crypto）をここに置くのは、core / features に入れるとアプリ（Hermes）へ
 * 持ち込むことになるため。
 *
 * ログに本文（盤面）を出さない。検証の失敗はエラーコードだけを警告に出す。
 *
 * @param input - 要求本文を JSON として読んだ値（未検証）
 * @param source - 届いた入口（`web` / `ios` / `android`）。由来の記録にだけ使う
 */
export async function archivePracticeProblem(
  input: unknown,
  source: PracticeProblemSource,
): Promise<ArchivePracticeProblemResult> {
  const parsed = parsePracticeProblemArchiveRequest(input);
  if (parsed.isErr()) {
    console.warn(
      `[archivePracticeProblem] 保存の要求を受け付けない: ${parsed.error}`,
    );
    return { ok: false, error: { type: "invalid", reason: parsed.error } };
  }
  const request = parsed.value;
  try {
    await db
      .insert(practiceProblems)
      .values({
        kind: request.kind,
        schemaVersion: request.schemaVersion,
        identityVersion: ARCHIVE_IDENTITY_VERSION,
        contentHash: contentHashOf(archiveIdentityInput(request)),
        payload: request.payload,
        source,
      })
      .onConflictDoNothing({
        target: [
          practiceProblems.kind,
          practiceProblems.identityVersion,
          practiceProblems.contentHash,
        ],
      });
  } catch (error) {
    // 例外をそのまま記録しない。Drizzle の失敗のメッセージは SQL のパラメータ
    // （盤面の JSON）を含むので、PostgreSQL のエラーコードだけを残す
    logExternalError(
      "archivePracticeProblem",
      "問題の保存に失敗",
      extractPgErrorCode(error) ?? "unknown",
    );
    return { ok: false, error: { type: "saveFailed" } };
  }
  return { ok: true };
}
