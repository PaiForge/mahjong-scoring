import { handleReadAppVersion } from "@/lib/mobile-api/app-version";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** アプリの最低バージョンを返す（アプリ向け。本体は `handleReadAppVersion`） */
export function GET(request: Request) {
  return handleReadAppVersion(request);
}

export const OPTIONS = mobilePreflight;
