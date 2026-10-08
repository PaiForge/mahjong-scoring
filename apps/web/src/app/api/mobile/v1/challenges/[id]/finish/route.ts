import { handleFinishChallenge } from "@/lib/mobile-api/challenge";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** チャレンジを確定し、成績を記録する（アプリ向け。本体は `handleFinishChallenge`） */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/challenges/[id]/finish">,
) {
  return handleFinishChallenge(request, (await params).id);
}

export const OPTIONS = mobilePreflight;
