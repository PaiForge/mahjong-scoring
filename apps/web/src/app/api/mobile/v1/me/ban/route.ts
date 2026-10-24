import { handleReadBan } from "@/lib/mobile-api/ban";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** BAN の知らせを返す（アプリ向け。本体は `handleReadBan`） */
export function GET(request: Request) {
  return handleReadBan(request);
}

export const OPTIONS = mobilePreflight;
