import { handleBeginChallenge } from "@/lib/mobile-api/challenge";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 記録付きのチャレンジを始める（アプリ向け。本体は `handleBeginChallenge`） */
export function POST(request: Request) {
  return handleBeginChallenge(request);
}

export const OPTIONS = mobilePreflight;
