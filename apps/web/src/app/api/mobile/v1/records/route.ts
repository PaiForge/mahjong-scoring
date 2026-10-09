import { handleReadRecords } from "@/lib/mobile-api/records";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** マイレコードのダッシュボードの材料を返す（アプリ向け。本体は `handleReadRecords`） */
export function GET(request: Request) {
  return handleReadRecords(request);
}

export const OPTIONS = mobilePreflight;
