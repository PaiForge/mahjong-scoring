import { handleReadBlocks } from "@/lib/mobile-api/moderation";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** ブロックした人の一覧を返す（アプリ向け。本体は `handleReadBlocks`） */
export function GET(request: Request) {
  return handleReadBlocks(request);
}

export const OPTIONS = mobilePreflight;
