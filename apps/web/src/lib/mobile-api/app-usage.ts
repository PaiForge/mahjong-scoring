import "server-only";

import { sql } from "drizzle-orm";
import { after } from "next/server";

import {
  APP_PLATFORM_HEADER,
  APP_VERSION_HEADER,
  isMobileAppPlatform,
  type MobileAppPlatform,
} from "@mahjong-scoring/features/app-version/mobile-api";
import { parseAppVersion } from "@mahjong-scoring/features/app-version/version";

import { db } from "../db";
import { logExternalError } from "../log-error";

/** 要求が申告したアプリの OS と版 */
export interface AppUsageReport {
  readonly platform: MobileAppPlatform;
  /** `1.1.0` の形。ヘッダが無い・読めない形なら undefined */
  readonly appVersion: string | undefined;
}

/**
 * 要求のヘッダからアプリの OS と版を読む。OS が無い・知らない値なら undefined
 * アプリ利用申告読み取り
 *
 * OS が無い要求は記録しない。`mobilePlatformOf()`（`platform.ts`）のように
 * `ios` へ倒さないのは、ヘッダを付けない画面確認用の web 版（react-native-web）を
 * iOS のアプリとして数えないため。ストアに出ている版はログイン付きの要求に
 * 最初の版からヘッダを付けている。
 *
 * @param request - 認証を通ったアプリ向け API の要求
 */
export function readAppUsageReport(
  request: Request,
): AppUsageReport | undefined {
  const platform = request.headers.get(APP_PLATFORM_HEADER);
  if (!isMobileAppPlatform(platform)) return undefined;
  const version = request.headers.get(APP_VERSION_HEADER);
  return {
    platform,
    appVersion:
      version !== null && parseAppVersion(version) ? version : undefined,
  };
}

/**
 * 同じ記録を書き直すまでの間隔
 *
 * 管理画面は日付までしか出さないので、1 日に 1 回で足りる。OS か版が
 * 変わったときは間隔を待たずに書く（アップデートした版をすぐ見られるように）。
 */
const REWRITE_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** インスタンスの中で覚えておく人数の上限（超えたら忘れて数え直す） */
const MAX_REMEMBERED_USERS = 10_000;

/**
 * このインスタンスが最後に書いた記録（ユーザー ID → 申告と時刻）
 *
 * アプリ向け API の要求のたびに DB へ問い合わせないための 1 段目の間引き。
 * インスタンスごとに別々で、再起動で消える。どのインスタンスから書いても
 * 1 日に 1 回へ揃えるのは 2 段目の SQL の条件（{@link writeAppUsage}）。
 */
const lastWritten = new Map<
  string,
  { readonly key: string; readonly at: number }
>();

/** 申告の見分けに使う文字列（OS と版の組） */
function reportKey(report: AppUsageReport): string {
  return `${report.platform}@${report.appVersion ?? ""}`;
}

/**
 * このインスタンスで書く番か（書くなら覚える）。テストが時刻を差し替える
 * アプリ利用記録の間引き
 */
export function claimAppUsageWrite(
  userId: string,
  report: AppUsageReport,
  now: number = Date.now(),
): boolean {
  const key = reportKey(report);
  const previous = lastWritten.get(userId);
  if (
    previous &&
    previous.key === key &&
    now - previous.at < REWRITE_INTERVAL_MS
  ) {
    return false;
  }
  if (lastWritten.size >= MAX_REMEMBERED_USERS) lastWritten.clear();
  lastWritten.set(userId, { key, at: now });
  return true;
}

/** 書き込みに失敗した人を忘れ、次の要求で書き直させる */
function forgetAppUsageWrite(userId: string): void {
  lastWritten.delete(userId);
}

/** テスト用: インスタンスの中の間引きを空にする */
export function resetAppUsageWritesForTest(): void {
  lastWritten.clear();
}

/**
 * アプリの利用を 1 行に書く（無ければ作り、あれば最後に使った日時と OS・版を更新する）
 * アプリ利用記録書き込み
 *
 * 退会を受け付けた人（`account_deletions` に行がある）の行は作らない。退会の
 * 工程が消した行を、退会の後に届いた要求が作り直さないため。
 * 更新は前回から 1 日経った（{@link REWRITE_INTERVAL_MS}）か、OS か版が変わった
 * ときだけ行う — インスタンスの中の間引きを通り抜けた要求（別のインスタンス・
 * 再起動の後）も、DB の側で 1 日に 1 回へ揃える。
 */
export async function writeAppUsage(
  userId: string,
  report: AppUsageReport,
): Promise<void> {
  const appVersion = report.appVersion ?? null;
  await db.execute(sql`
    INSERT INTO app_usage (user_id, platform, app_version)
    SELECT ${userId}::uuid, ${report.platform}, ${appVersion}
    WHERE NOT EXISTS (
      SELECT 1 FROM account_deletions WHERE user_id = ${userId}::uuid
    )
    ON CONFLICT (user_id) DO UPDATE SET
      platform = EXCLUDED.platform,
      app_version = EXCLUDED.app_version,
      last_seen_at = now()
    WHERE app_usage.last_seen_at < now() - interval '1 day'
      OR app_usage.platform IS DISTINCT FROM EXCLUDED.platform
      OR app_usage.app_version IS DISTINCT FROM EXCLUDED.app_version
  `);
}

/**
 * 認証を通ったアプリ向け API の要求から、アプリの利用を記録する
 * アプリ利用記録
 *
 * 書き込みは応答を返した後に `after()` で行い、応答を遅らせない。素の Promise を
 * 投げっぱなしにすると、サーバーレスでは応答の後に処理ごと止められることがある。
 * 失敗はログにだけ残し、要求には伝えない。
 *
 * 退会の受付（`forAccountDeletion`）からは呼ばない（`auth.ts`）。退会を受け付けた
 * 人の行を作らない条件は {@link writeAppUsage} の SQL にもある。
 *
 * @param request - 認証を通ったアプリ向け API の要求
 * @param userId - 認証を通ったユーザーの ID
 */
export function recordAppUsage(request: Request, userId: string): void {
  const report = readAppUsageReport(request);
  if (!report || !claimAppUsageWrite(userId, report)) return;
  try {
    after(async () => {
      try {
        await writeAppUsage(userId, report);
      } catch (error) {
        forgetAppUsageWrite(userId);
        logExternalError("recordAppUsage", "failed to record app usage", error);
      }
    });
  } catch (error) {
    // `after()` は要求の外で呼ぶと投げる。記録のために要求そのものを落とさない
    forgetAppUsageWrite(userId);
    logExternalError("recordAppUsage", "failed to schedule app usage", error);
  }
}
