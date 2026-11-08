import { handleReadAnnouncement } from "@/lib/mobile-api/announcements";
import { mobilePreflight } from "@/lib/mobile-api/response";

/**
 * お知らせ 1 件を返す（アプリ向け。本体は `handleReadAnnouncement`）
 *
 * 要求をそのまま渡し、`?locale=` を本体に読ませる（英語は英訳の行だけ、
 * 未指定は従来の ja）。
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/announcements/[slug]">,
) {
  const { slug } = await params;
  return handleReadAnnouncement(slug, request);
}

export const OPTIONS = mobilePreflight;
