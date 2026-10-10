import { handleReadRecordResults } from "@/lib/mobile-api/records";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** マイレコードの全履歴の 1 ページを返す（アプリ向け。本体は `handleReadRecordResults`） */
export function GET(request: Request) {
  return handleReadRecordResults(request);
}

export const OPTIONS = mobilePreflight;
