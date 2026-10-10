import { handleReadLeaderboardRanks } from "@/lib/mobile-api/leaderboard";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 本人の全土俵の順位を返す（アプリ向け。本体は `handleReadLeaderboardRanks`） */
export function GET(request: Request) {
  return handleReadLeaderboardRanks(request);
}

export const OPTIONS = mobilePreflight;
