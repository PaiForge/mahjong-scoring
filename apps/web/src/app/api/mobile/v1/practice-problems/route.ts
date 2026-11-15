import { handleArchivePracticeProblem } from "@/lib/mobile-api/practice-problems";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 出題した問題を保存する（アプリ向け。本体は `handleArchivePracticeProblem`） */
export function POST(request: Request) {
  return handleArchivePracticeProblem(request);
}

export const OPTIONS = mobilePreflight;
