import { handleReadAnnouncements } from "@/lib/mobile-api/announcements";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** お知らせの一覧の 1 ページを返す（アプリ向け。本体は `handleReadAnnouncements`） */
export function GET(request: Request) {
  return handleReadAnnouncements(request);
}

export const OPTIONS = mobilePreflight;
