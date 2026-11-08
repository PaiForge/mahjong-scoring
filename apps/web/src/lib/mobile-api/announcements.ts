import "server-only";

import type { NextResponse } from "next/server";

import { ANNOUNCEMENTS_PER_PAGE } from "@mahjong-scoring/features/announcements/listing";
import type {
  MobileAnnouncementErrorCode,
  MobileAnnouncementResponse,
  MobileAnnouncementsResponse,
} from "@mahjong-scoring/features/announcements/mobile-api";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import {
  getPublishedAnnouncement,
  getPublishedAnnouncementCount,
  getPublishedAnnouncementCountExact,
  getPublishedAnnouncementExact,
  getPublishedAnnouncementsExact,
  getPublishedAnnouncementsPaginated,
} from "../announcements/queries";
import { parsePageParam, resolvePagination } from "../pagination";

import { limitPublicMobileRequest } from "./public-rate-limit";
import { mobileJson, mobileServerError } from "./response";

/**
 * アプリ向けのお知らせ API の言語
 *
 * @design 任意の `?locale=ja|en`。未指定・未対応の値は従来どおり ja
 * アプリは端末の言語を `?locale=` に付けて呼ぶ。英語（既定以外）は
 * 言語一致のクエリ（`*Exact`。一覧・件数・詳細）で引き、英訳して公開した
 * 行だけを返す — 英語の端末に日本語の記事を見せないため（web の英語の
 * お知らせと同じ規則）。件数も英語の行だけを数え、一覧に出ない記事で空の
 * ページを作らない。詳細は英語の行が無ければ日本語の行があっても 404
 * `notFound`。
 *
 * 未指定・`ja`・未対応の値（`xx` 等）は従来の応答（ja・fallback 付き・
 * `COUNT(DISTINCT slug)` の件数）のまま。ストアに出ている古い版のアプリは
 * `locale` を付けずに呼ぶので、その応答を変えない。未対応の値を 400 に
 * しないのも同じ理由（読めない値で記事が消えるより、従来の応答を返す）。
 * 応答の形は言語で変えない。
 */
function localeOf(searchParams: URLSearchParams): SupportedLocale {
  const value = searchParams.get("locale");
  return value !== null && isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}

/** 日時を JSON に載せる形（ISO 8601）にする。無ければ undefined */
function isoOf(value: Date | string | null): string | undefined {
  return value === null ? undefined : new Date(value).toISOString();
}

/**
 * お知らせの一覧の 1 ページを返す（アプリ向け）
 * お知らせ一覧API（アプリ向け）
 *
 * web の一覧ページと同じ材料・同じ並び。公開の記事なのでログインを要らない。
 * 言語は `?locale=`（{@link localeOf}。英語は英訳の行だけ・件数も英語の行だけ、
 * 未指定は従来の ja）。範囲外のページは最後のページに丸める
 * （web は 404 にするが、アプリは「さらに読み込む」で次を読むだけなので、
 * 読んでいる間に記事が減っても空振りで終わらせる）。認証が無いので IP の
 * 回数だけを絞る。
 */
export async function handleReadAnnouncements(
  request: Request,
): Promise<NextResponse> {
  const rateLimited = await limitPublicMobileRequest("readMobileAnnouncements");
  if (rateLimited) return rateLimited;
  const { searchParams } = new URL(request.url);
  const requestedPage = parsePageParam(searchParams.get("page") ?? undefined);
  const locale = localeOf(searchParams);
  const exact = locale !== DEFAULT_LOCALE;
  try {
    const totalCount = exact
      ? await getPublishedAnnouncementCountExact(locale)
      : await getPublishedAnnouncementCount();
    const { currentPage, totalPages, limit, offset } = resolvePagination(
      requestedPage,
      totalCount,
      ANNOUNCEMENTS_PER_PAGE,
    );

    const rows = exact
      ? await getPublishedAnnouncementsExact(locale, limit, offset)
      : await getPublishedAnnouncementsPaginated(DEFAULT_LOCALE, limit, offset);
    return mobileJson<MobileAnnouncementsResponse>({
      items: rows.map((row) => ({
        slug: row.slug,
        title: row.title,
        publishedAt: isoOf(row.publishedAt),
        pinned: row.pinnedAt !== null,
      })),
      page: currentPage,
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
 * なければ 404 `notFound`。言語は `?locale=`（{@link localeOf}）で、英語は
 * 英語の行が無ければ日本語の行があっても 404 `notFound`。認証が無いので
 * IP の回数だけを絞る。
 *
 * @param slug - お知らせの slug（ルートのパラメータ）
 * @param request - 要求（`?locale=` を読む）。省略は従来の ja
 */
export async function handleReadAnnouncement(
  slug: string,
  request?: Request,
): Promise<NextResponse> {
  const rateLimited = await limitPublicMobileRequest("readMobileAnnouncement");
  if (rateLimited) return rateLimited;
  const locale =
    request === undefined
      ? DEFAULT_LOCALE
      : localeOf(new URL(request.url).searchParams);
  try {
    const announcement =
      locale === DEFAULT_LOCALE
        ? await getPublishedAnnouncement(slug, DEFAULT_LOCALE)
        : await getPublishedAnnouncementExact(slug, locale);
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
