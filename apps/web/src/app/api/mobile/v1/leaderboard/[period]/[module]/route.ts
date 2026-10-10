import { handleReadLeaderboard } from "@/lib/mobile-api/leaderboard";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** ある土俵・期間のランキングの 1 ページを返す（アプリ向け。本体は `handleReadLeaderboard`） */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/leaderboard/[period]/[module]">,
) {
  const { period, module: slug } = await params;
  return handleReadLeaderboard(request, period, slug);
}

export const OPTIONS = mobilePreflight;
