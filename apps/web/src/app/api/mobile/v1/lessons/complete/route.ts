import { handleCompleteLessons } from "@/lib/mobile-api/progress";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** レッスンの完了をまとめて記録する（アプリ向け。本体は `handleCompleteLessons`） */
export function POST(request: Request) {
  return handleCompleteLessons(request);
}

export const OPTIONS = mobilePreflight;
