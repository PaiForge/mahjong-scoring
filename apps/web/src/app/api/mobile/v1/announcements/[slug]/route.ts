import { handleReadAnnouncement } from "@/lib/mobile-api/announcements";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** お知らせ 1 件を返す（アプリ向け。本体は `handleReadAnnouncement`） */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/mobile/v1/announcements/[slug]">,
) {
  const { slug } = await params;
  return handleReadAnnouncement(slug);
}

export const OPTIONS = mobilePreflight;
