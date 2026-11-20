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
 * 匿名の書き込み口を作らずに済む。web の入口は未ログインの要求を保存せずに 204 で
 * 受け流し、アプリの入口は 401 を返す。ユーザー名を決める前の利用者は保存してよい
 * （盤面は利用者に紐づけない）。BAN 中・退会処理中は入口の認証
 * （`authorizeApiRequest` / `authorizeMobileRequest`）が弾く。模試・レッスン・
 * お試し・デモは別の生成経路で、ここへは届かない。
 *
 * @design 停止スイッチ（`PRACTICE_PROBLEM_ARCHIVE_DISABLED=1`）
 * 収集を止めたいときは環境変数を `1` にする（{@link isPracticeProblemArchiveDisabled}）。
 * 入口は最初にこれを見て、認証も保存もせず 204 を返す。クライアントは応答の中身を
 * 使わないので専用の応答は要らず、5xx を返すと再送を誘発する。停止中は認証サーバーへの
 * 問い合わせも省く。止めるのは出題ごとの収集だけで、問題の報告が盤面を保存する経路
 * （{@link ensurePracticeProblem}）は止めない（理由はその関数の説明）。
 *
 * @design 保存は要求の中で終える。専用のキュー・worker・応答後の処理は持たない
 * 入口は DB への書き込みを待ってから 204 を返す。応答を先に返して保存を
 * サーバーの中の待たない処理に任せる形は採らない — 204 が「保存できた、または
 * 同じ盤面が既にある」を意味しなくなり、関数の実行環境が応答の後に止まれば
 * 書き込みが黙って消える。練習を待たせないのは送信側の役目で、別の要求として
 * 送って応答を待たない（web・アプリの `problem-archive.ts`）。メッセージキューや
 * worker も置かない。取りこぼしを許す収集に、届け切る仕組みは見合わない。
 *
 * @design 1 問につき 1 要求。出題の回数確認には相乗りさせない
 * 回数確認（`beginPracticeQuestion`）の要求に前の問題を載せれば要求の数は
 * 増えないが、検証と書き込みのぶん回数確認の応答が遅れ（次の問題が出るのを
 * 待たせる）、回数制限と収集が 1 つの要求に結び付く。まとめて送るバッチ化も
 * 同じ理由で初版では採らない。所要時間や DB の負荷が問題になったら、測ってから
 * 比べ直す。
 *
 * @design 出題時の保存は行の ID を返さない。操作に結び付けるときは操作の時点で ID を得る
 * 出題時の保存の用途は盤面を貯めることだけで、送信側は応答を使わない。利用者の
 * 操作を問題に結び付ける機能は、その操作の時点で同じ盤面を送り、保存した（または
 * 既にある）行の ID を受け取る経路（{@link ensurePracticeProblem}）を使う。問題の
 * 報告（`problem_reports`）がこの経路で、出題時に取りこぼした問題も報告の時点で
 * 保存される。お気に入りや問題ごとの正解率を作るときも同じ経路を使う。
 * 送信は取りこぼしを許す（通信断・画面を閉じる・待ちの上限）ので、この表の
 * 行数は出題の回数も出題の分布も表さない。
 *
 * @design 同じ盤面をまとめても、行数の上限にはならない
 * 検証を通る盤面の数は事実上限りが無く、ログイン済みの利用者は検証を通る
 * 手作りの盤面を API へ直接送れる（画面で生成された証明は取れない）。歯止めは
 * 回数の枠（インメモリでインスタンスごと。全体の厳密な上限ではない）・本文の
 * 上限・停止スイッチで、行数の監視値と止める基準は決めていない。増え方を見て
 * から決める。混ざった行は `source` と `created_at` で切り分ける。増え方
 * （種別 × 由来の数・日ごとの新規保存数・停止中かどうか）は管理画面の
 * `/admin/practice-problems` で見られる。
 */
import "server-only";

import { createHash } from "node:crypto";

import {
  archiveIdentityInput,
  parsePracticeProblemArchiveRequest,
  ARCHIVE_IDENTITY_VERSION,
  type ArchiveValidationError,
  type PracticeProblemArchiveRequest,
} from "@mahjong-scoring/core";
import { and, eq } from "drizzle-orm";

import { db, practiceProblems, type NewPracticeProblem } from "../db";
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

/** 同じ盤面を 1 行にまとめる一意制約の列（`uq_practice_problems_identity`） */
const PRACTICE_PROBLEM_IDENTITY = [
  practiceProblems.kind,
  practiceProblems.identityVersion,
  practiceProblems.contentHash,
];

/**
 * 検証済みの盤面から保存する行を組み立てる（ハッシュはサーバーが計算する）
 *
 * 出題時の保存（{@link archivePracticeProblem}）と報告の保存
 * （{@link ensurePracticeProblem}）が同じ行を作るために共有する。
 */
function practiceProblemRowOf(
  request: PracticeProblemArchiveRequest,
  source: PracticeProblemSource,
): NewPracticeProblem {
  return {
    kind: request.kind,
    schemaVersion: request.schemaVersion,
    identityVersion: ARCHIVE_IDENTITY_VERSION,
    contentHash: contentHashOf(archiveIdentityInput(request)),
    payload: request.payload,
    source,
  };
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
      .values(practiceProblemRowOf(request, source))
      .onConflictDoNothing({ target: PRACTICE_PROBLEM_IDENTITY });
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

/**
 * 検証済みの盤面の行を確かめ、無ければ保存して、その行の ID を返す
 * 問題保存（ID 取得）
 *
 * 問題の報告（`lib/problem-reports/create-problem-report.ts`）が、報告を結ぶ
 * 行を得るために呼ぶ。`INSERT ... ON CONFLICT DO NOTHING RETURNING id` で入れ、
 * 返らなければ（同じ盤面が既にある）一意制約の列 `(kind, identity_version,
 * content_hash)` で読み直す。行の組み立て（ハッシュの計算を含む）は
 * {@link archivePracticeProblem} と共有するので、出題時に保存された行と同じ行に着地する。
 *
 * @design 報告の要求は盤面を本文に持ち、ここで行を確かめてから報告を結ぶ
 * 出題時の保存は取りこぼしを許す（通信断・停止スイッチ・待ちの上限）ので、
 * クライアントは行の ID を知らない。報告の時点で同じ盤面を送り、無ければここで
 * 保存する。採らなかった案:
 * - 出題時の保存の応答で ID を返す: 保存を待つことになり、練習を止める
 * - 盤面を `problem_reports` に複製する: 同じ盤面への報告を 1 つの問題にまとめられない
 *
 * @design 停止スイッチ（`PRACTICE_PROBLEM_ARCHIVE_DISABLED`）を見ない
 * スイッチは出題ごとの収集を止めるためのもの。報告は人の操作 1 回で、回数の枠も
 * 別に掛かる（`reportProblem`）。盤面が無いと報告を調べられないので、止めている間も保存する。
 *
 * 失敗は例外のまま投げる。呼び出し側はログに例外の中身を出さない（Drizzle の
 * 失敗のメッセージは SQL のパラメータ（盤面の JSON）を含む）。
 *
 * @param request - 検証済みの盤面（`parsePracticeProblemArchiveRequest` を通ったもの）
 * @param source - 届いた入口（`web` / `ios` / `android`）。新しく入れるときの由来にだけ使う
 * @returns `practice_problems.id`
 * @throws DB への書き込み・読み取りが失敗したとき
 */
export async function ensurePracticeProblem(
  request: PracticeProblemArchiveRequest,
  source: PracticeProblemSource,
): Promise<string> {
  const row = practiceProblemRowOf(request, source);
  const [inserted] = await db
    .insert(practiceProblems)
    .values(row)
    .onConflictDoNothing({ target: PRACTICE_PROBLEM_IDENTITY })
    .returning({ id: practiceProblems.id });
  if (inserted) return inserted.id;
  const [existing] = await db
    .select({ id: practiceProblems.id })
    .from(practiceProblems)
    .where(
      and(
        eq(practiceProblems.kind, row.kind),
        eq(practiceProblems.identityVersion, row.identityVersion),
        eq(practiceProblems.contentHash, row.contentHash),
      ),
    )
    .limit(1);
  if (!existing) {
    // 一意制約に当たったのに行が無い = 間に消された。保存問題は報告・本日の問題が
    // RESTRICT で参照するので、通常は起こらない
    throw new Error("practice problem vanished after a conflicting insert");
  }
  return existing.id;
}
