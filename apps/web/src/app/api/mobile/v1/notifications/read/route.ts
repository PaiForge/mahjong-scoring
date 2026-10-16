import { handleMarkNotificationsRead } from "@/lib/mobile-api/notifications";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 通知を既読にする（アプリ向け。本体は `handleMarkNotificationsRead`） */
export function POST(request: Request) {
  return handleMarkNotificationsRead(request);
}

export const OPTIONS = mobilePreflight;
