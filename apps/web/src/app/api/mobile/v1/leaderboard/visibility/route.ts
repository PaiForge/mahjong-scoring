import {
  handleReadLeaderboardVisibility,
  handleUpdateLeaderboardVisibility,
} from "@/lib/mobile-api/leaderboard";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** ランキングに表示しない設定を返す（アプリ向け。本体は `handleReadLeaderboardVisibility`） */
export function GET(request: Request) {
  return handleReadLeaderboardVisibility(request);
}

/** ランキングに表示しない設定を保存する（アプリ向け。本体は `handleUpdateLeaderboardVisibility`） */
export function POST(request: Request) {
  return handleUpdateLeaderboardVisibility(request);
}

export const OPTIONS = mobilePreflight;
