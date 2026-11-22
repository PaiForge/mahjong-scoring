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
import { JST_TIME_ZONE, jstDayKey } from "@mahjong-scoring/features/jst";

import { logExternalError } from "../log-error";
import { writeAsAccount } from "../users/account-write-lock";

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

/** インスタンスの中で覚えておく人数の上限（超えたら忘れて数え直す） */
const MAX_REMEMBERED_USERS = 10_000;

/**
 * このインスタンスが最後に書いた記録（ユーザー ID → 申告と JST の日付の組）
 *
 * アプリ向け API の要求のたびに DB へ問い合わせないための 1 段目の間引き。
 * インスタンスごとに別々で、再起動で消える。どのインスタンスから書いても
 * 1 日に 1 回へ揃えるのは 2 段目の SQL の条件（{@link writeAppUsage}）。
 *
 * 間引きの単位は「24 時間」ではなく JST の日付。管理画面が JST の日付を出すので、
 * その日の最初の要求で書けば日付が常に正しい。24 時間の間隔で比べると、前日の
 * 遅い時刻に書いた人の翌日の利用が書かれず、日付が 1〜2 日古く見える。
 */
const lastWritten = new Map<string, string>();

/** 申告の見分けに使う文字列（OS・版・JST の日付の組） */
function writeKey(report: AppUsageReport, now: Date): string {
  return `${report.platform}@${report.appVersion ?? ""}@${jstDayKey(now)}`;
}

/**
 * このインスタンスで書く番か（書くなら覚える）。テストが時刻を差し替える
 * アプリ利用記録の間引き
 *
 * 同じ人の同じ申告は JST の 1 日に 1 回だけ通す。OS か版が変わったら
 * その日のうちでも通す（アップデートした版をすぐ見られるように）。
 */
export function claimAppUsageWrite(
  userId: string,
  report: AppUsageReport,
  now: Date = new Date(),
): boolean {
  const key = writeKey(report, now);
  if (lastWritten.get(userId) === key) return false;
  if (lastWritten.size >= MAX_REMEMBERED_USERS) lastWritten.clear();
  lastWritten.set(userId, key);
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
 * 更新は最後に書いたのが JST の前の日以前か、OS か版が変わったときだけ行う —
 * インスタンスの中の間引きを通り抜けた要求（別のインスタンス・再起動の後）も、
 * DB の側で 1 日に 1 回へ揃える。初めて使った日時は更新しない。
 *
 * 退会とは `writeAsAccount`（`users/account-write-lock.ts`）で直列にする。
 * 退会を受け付けた人の行は作らず、受付の前に書き始めた分は受付が待ってから
 * 退会の工程（`deleteAccountData`）が消す。入口（`auth.ts`）で退会処理中の人を
 * 弾くだけでは、通った後に受付と削除が済んでから書く経路が残る。
 *
 * @returns 書いたか（退会を受け付けた後なら false）
 */
export async function writeAppUsage(
  userId: string,
  report: AppUsageReport,
): Promise<boolean> {
  const appVersion = report.appVersion ?? null;
  const result = await writeAsAccount(userId, (tx) =>
    tx.execute(sql`
      INSERT INTO app_usage (user_id, platform, app_version)
      VALUES (${userId}::uuid, ${report.platform}, ${appVersion})
      ON CONFLICT (user_id) DO UPDATE SET
        platform = EXCLUDED.platform,
        app_version = EXCLUDED.app_version,
        last_seen_at = now()
      WHERE (app_usage.last_seen_at AT TIME ZONE ${JST_TIME_ZONE})::date
          < (now() AT TIME ZONE ${JST_TIME_ZONE})::date
        OR app_usage.platform IS DISTINCT FROM EXCLUDED.platform
        OR app_usage.app_version IS DISTINCT FROM EXCLUDED.app_version
    `),
  );
  return result.written;
}

/**
 * 認証を通ったアプリ向け API の要求から、アプリの利用を記録する
 * アプリ利用記録
 *
 * 書き込みは応答を返した後に `after()` で行い、応答を遅らせない。素の Promise を
 * 投げっぱなしにすると、サーバーレスでは応答の後に処理ごと止められることがある。
 * 失敗はログにだけ残し、要求には伝えない。
 *
 * 退会の受付（`forAccountDeletion`）からは呼ばない（`auth.ts`）。退会との直列化は
 * {@link writeAppUsage}。
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
