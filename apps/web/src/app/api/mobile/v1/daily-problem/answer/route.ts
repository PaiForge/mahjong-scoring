import { handleRecordDailyProblemAnswer } from "@/lib/mobile-api/daily-problem";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 本日の問題の解答（正誤）を記録する（アプリ向け。本体は `handleRecordDailyProblemAnswer`） */
export function POST(request: Request) {
  return handleRecordDailyProblemAnswer(request);
}

export const OPTIONS = mobilePreflight;
