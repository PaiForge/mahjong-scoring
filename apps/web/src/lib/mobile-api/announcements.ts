import "server-only";

import type { NextResponse } from "next/server";

import type {
  MobileAnnouncementErrorCode,
  MobileAnnouncementResponse,
  MobileAnnouncementsResponse,
} from "@mahjong-scoring/features/announcements/mobile-api";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import {
  getPublishedAnnouncement,
  getPublishedAnnouncementCount,
  getPublishedAnnouncementsPaginated,
} from "../announcements/queries";
import { getPaginationData, parsePageParam } from "../pagination";

import { mobileJson, mobileServerError } from "./response";

/**
 * 1 ページの件数（web の一覧ページと同じ）
 * お知らせ一覧件数
 */
const ANNOUNCEMENTS_PER_PAGE = 20;

/** 日時を JSON に載せる形（ISO 8601）にする。無ければ undefined */
function isoOf(value: Date | string | null): string | undefined {
  return value === null ? undefined : new Date(value).toISOString();
}

/**
 * お知らせの一覧の 1 ページを返す（アプリ向け）
 * お知らせ一覧API（アプリ向け）
 *
 * web の一覧ページと同じ材料・同じ並び。公開の記事なのでログインを要らない。
 * ロケールは web と同じく既定（ja）に固定する — アプリは端末の言語に
 * 関わらず日本語の辞書で出している。範囲外のページは最後のページに丸める
 * （web は 404 にするが、アプリは「さらに読み込む」で次を読むだけなので、
 * 読んでいる間に記事が減っても空振りで終わらせる）。
 */
export async function handleReadAnnouncements(
  request: Request,
): Promise<NextResponse> {
  const requestedPage = parsePageParam(
    new URL(request.url).searchParams.get("page") ?? undefined,
  );
  try {
    const totalCount = await getPublishedAnnouncementCount();
    const pageSize = ANNOUNCEMENTS_PER_PAGE;
    const totalPages = Math.ceil(totalCount / pageSize);
    const page = Math.max(1, Math.min(requestedPage, totalPages));
    const { limit, offset } = getPaginationData(page, totalCount, pageSize);
    const rows = await getPublishedAnnouncementsPaginated(
      DEFAULT_LOCALE,
      limit,
      offset,
    );
    return mobileJson<MobileAnnouncementsResponse>({
      items: rows.map((row) => ({
        slug: row.slug,
        title: row.title,
        publishedAt: isoOf(row.publishedAt),
        pinned: row.pinnedAt !== null,
      })),
      page,
      totalPages,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/announcements",
      "読み取りに失敗",
      error,
    );
  }
}

/**
 * お知らせ 1 件を返す（アプリ向け）
 * お知らせ詳細API（アプリ向け）
 *
 * 本文は Markdown の原文のまま返し、描き方はアプリが決める。公開中で
 * なければ 404 `notFound`。
 *
 * @param slug - お知らせの slug（ルートのパラメータ）
 */
export async function handleReadAnnouncement(
  slug: string,
): Promise<NextResponse> {
  try {
    const announcement = await getPublishedAnnouncement(slug, DEFAULT_LOCALE);
    if (!announcement) {
      return mobileJson<{ error: MobileAnnouncementErrorCode }>(
        { error: "notFound" },
        { status: 404 },
      );
    }
    return mobileJson<MobileAnnouncementResponse>({
      slug: announcement.slug,
      title: announcement.title,
      content: announcement.content,
      publishedAt: isoOf(announcement.publishedAt),
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/announcements/[slug]",
      "読み取りに失敗",
      error,
    );
  }
}
