import { handleDeleteAvatar } from "@/lib/mobile-api/avatar";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** アバター画像を消す（アプリ向け。本体は `handleDeleteAvatar`） */
export function POST(request: Request) {
  return handleDeleteAvatar(request);
}

export const OPTIONS = mobilePreflight;
