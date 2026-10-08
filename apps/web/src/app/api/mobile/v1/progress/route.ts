import { handleReadProgress } from "@/lib/mobile-api/progress";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 本人の進み具合を返す（アプリ向け。本体は `handleReadProgress`） */
export function GET(request: Request) {
  return handleReadProgress(request);
}

export const OPTIONS = mobilePreflight;
