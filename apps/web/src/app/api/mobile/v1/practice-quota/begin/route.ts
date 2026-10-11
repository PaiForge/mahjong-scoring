import { handleBeginPracticeQuota } from "@/lib/mobile-api/practice-quota";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 1 問始める前に回数制限の枠を 1 つ消費する（アプリ向け。本体は `handleBeginPracticeQuota`） */
export function POST(request: Request) {
  return handleBeginPracticeQuota(request);
}

export const OPTIONS = mobilePreflight;
