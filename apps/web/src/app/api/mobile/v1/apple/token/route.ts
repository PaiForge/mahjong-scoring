import { handleSaveAppleToken } from "@/lib/mobile-api/apple";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** Apple の認可コードを預かる（アプリ向け。本体は `handleSaveAppleToken`） */
export function POST(request: Request) {
  return handleSaveAppleToken(request);
}

export const OPTIONS = mobilePreflight;
