import { handlePeekPracticeQuota } from "@/lib/mobile-api/practice-quota";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 回数制限の今日の残りを消費せずに読む（アプリ向け。本体は `handlePeekPracticeQuota`） */
export function GET(request: Request) {
  return handlePeekPracticeQuota(request);
}

export const OPTIONS = mobilePreflight;
