import { handleReadChallenge } from "@/lib/mobile-api/challenge";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** チャレンジの今の状態を返す（アプリ向け。本体は `handleReadChallenge`） */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/challenges/[id]">,
) {
  return handleReadChallenge(request, (await params).id);
}

export const OPTIONS = mobilePreflight;
