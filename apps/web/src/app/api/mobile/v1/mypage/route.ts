import { handleReadMypage } from "@/lib/mobile-api/mypage";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** マイページのトップの材料を返す（アプリ向け。本体は `handleReadMypage`） */
export function GET(request: Request) {
  return handleReadMypage(request);
}

export const OPTIONS = mobilePreflight;
