import { handlePauseChallenge } from "@/lib/mobile-api/challenge";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 一時停止・再開を記録する（アプリ向け。本体は `handlePauseChallenge`） */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/challenges/[id]/pause">,
) {
  return handlePauseChallenge(request, (await params).id);
}

export const OPTIONS = mobilePreflight;
