import { handleReadUnanswered } from "@/lib/mobile-api/challenge";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 時間切れのときに出ていた問題を返す（アプリ向け。本体は `handleReadUnanswered`） */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/challenges/[id]/unanswered">,
) {
  return handleReadUnanswered(request, (await params).id);
}

export const OPTIONS = mobilePreflight;
