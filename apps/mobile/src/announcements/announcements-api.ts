import {
  mobileAnnouncementApiPath,
  mobileAnnouncementsApiUrl,
  parseMobileAnnouncementResponse,
  parseMobileAnnouncementsResponse,
  type MobileAnnouncementErrorCode,
  type MobileAnnouncementResponse,
  type MobileAnnouncementsResponse,
} from "@mahjong-scoring/features/announcements/mobile-api";

import { SITE_URL } from "../lib/app-site-url";

/**
 * お知らせの API の失敗
 *
 * - `network` — 応答が得られなかった
 * - `unknown` — 応答の形が違う・サーバーの失敗
 */
export type AnnouncementApiFailure =
  MobileAnnouncementErrorCode | "network" | "unknown";

/** 読み取りの結果。失敗なら理由 */
export type AnnouncementApiResult<T> =
  T | { readonly error: AnnouncementApiFailure };

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
  const value = parse(await response.json().catch(() => undefined));
  return value ?? { error: "unknown" };
}

/**
 * お知らせの一覧の 1 ページを読む
 * お知らせ一覧取得
 *
 * @param page - 1 始まりのページ番号
 */
export function fetchAnnouncements(
  page: number,
): Promise<AnnouncementApiResult<MobileAnnouncementsResponse>> {
  return read(
    mobileAnnouncementsApiUrl(page),
    parseMobileAnnouncementsResponse,
  );
}

/**
 * お知らせ 1 件を読む
 * お知らせ取得
 */
export function fetchAnnouncement(
  slug: string,
): Promise<AnnouncementApiResult<MobileAnnouncementResponse>> {
  return read(mobileAnnouncementApiPath(slug), parseMobileAnnouncementResponse);
}
