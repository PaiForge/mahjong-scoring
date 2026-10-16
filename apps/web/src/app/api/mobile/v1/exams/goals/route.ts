import { handleReadExamGoals } from "@/lib/mobile-api/exam-goals";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 昇級試験の合格ラインを返す（アプリ向け。本体は `handleReadExamGoals`） */
export function GET() {
  return handleReadExamGoals();
}

export const OPTIONS = mobilePreflight;
