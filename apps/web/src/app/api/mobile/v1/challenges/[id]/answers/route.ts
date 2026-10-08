import { handleAnswerChallenge } from "@/lib/mobile-api/challenge";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 回答を受け付ける（アプリ向け。本体は `handleAnswerChallenge`） */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/challenges/[id]/answers">,
) {
  return handleAnswerChallenge(request, (await params).id);
}

export const OPTIONS = mobilePreflight;
