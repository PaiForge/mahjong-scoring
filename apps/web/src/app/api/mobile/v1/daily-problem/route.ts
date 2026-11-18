import { handleReadDailyProblem } from "@/lib/mobile-api/daily-problem";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 今日の問題と自分の解答を読む（アプリ向け。本体は `handleReadDailyProblem`） */
export function GET(request: Request) {
  return handleReadDailyProblem(request);
}

export const OPTIONS = mobilePreflight;
