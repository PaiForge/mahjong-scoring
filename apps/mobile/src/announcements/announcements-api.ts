import {
  mobileAnnouncementApiPath,
  mobileAnnouncementsApiUrl,
  parseMobileAnnouncementResponse,
  parseMobileAnnouncementsResponse,
  type MobileAnnouncementErrorCode,
  type MobileAnnouncementResponse,
  type MobileAnnouncementsResponse,
} from "@mahjong-scoring/features/announcements/mobile-api";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import { SITE_URL } from "../lib/app-site-url";
import { readJson } from "../auth/read-json";
import type { MobileApiValue } from "../auth/request-mobile-api";

/**
 * お知らせの API の失敗
 *
 * - `network` — 応答が得られなかった
 * - `unknown` — 応答の形が違う・サーバーの失敗
 */
export type AnnouncementApiFailure =
  MobileAnnouncementErrorCode | "network" | "unknown";

/** 読み取りの結果。失敗なら理由 */
export type AnnouncementApiResult<T> = MobileApiValue<
  T,
  AnnouncementApiFailure
>;

/**
 * GET を送り、成功なら応答を検証して返す
 *
 * お知らせは公開の記事なのでトークンを付けない（`callMobileApi` を通さない）。
 * ログイン中でもゲストと同じものが返る。
 */
async function read<T extends object>(
  path: string,
  parse: (body: unknown) => T | undefined,
): Promise<AnnouncementApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${SITE_URL}${path}`);
  } catch {
    return { error: "network" };
  }
  if (response.status === 404) return { error: "notFound" };
  if (!response.ok) return { error: "unknown" };
  const value = parse(await readJson(response));
  return value ?? { error: "unknown" };
}

/**
 * お知らせの一覧の 1 ページを読む
 * お知らせ一覧取得
 *
 * 英語の端末では英訳して公開した記事だけが返る（件数も英語の記事だけ）。
 * 日本語の記事を英語の画面に混ぜないため、呼び出し側は必ずアプリの言語
 * （`useAppLocale()`）を渡す。
 *
 * @param page - 1 始まりのページ番号
 * @param locale - アプリの言語
 */
export function fetchAnnouncements(
  page: number,
  locale: SupportedLocale,
): Promise<AnnouncementApiResult<MobileAnnouncementsResponse>> {
  return read(
    mobileAnnouncementsApiUrl(page, locale),
    parseMobileAnnouncementsResponse,
  );
}

/**
 * お知らせ 1 件を読む
 * お知らせ取得
 *
 * 英語の端末では英訳の行が無い記事は `notFound` になる（日本語の本文を
 * 英語の画面に出さない）。
 *
 * @param slug - お知らせの slug
 * @param locale - アプリの言語（`useAppLocale()`）
 */
export function fetchAnnouncement(
  slug: string,
  locale: SupportedLocale,
): Promise<AnnouncementApiResult<MobileAnnouncementResponse>> {
  return read(
    mobileAnnouncementApiPath(slug, locale),
    parseMobileAnnouncementResponse,
  );
}
