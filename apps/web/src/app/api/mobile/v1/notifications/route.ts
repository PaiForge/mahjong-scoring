import { handleReadNotifications } from "@/lib/mobile-api/notifications";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 通知の一覧の 1 ページと未読数を返す（アプリ向け。本体は `handleReadNotifications`） */
export function GET(request: Request) {
  return handleReadNotifications(request);
}

export const OPTIONS = mobilePreflight;
