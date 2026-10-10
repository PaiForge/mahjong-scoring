import { handleUploadAvatar } from "@/lib/mobile-api/avatar";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** アバター画像を上げる（アプリ向け。本体は `handleUploadAvatar`） */
export function POST(request: Request) {
  return handleUploadAvatar(request);
}

export const OPTIONS = mobilePreflight;
