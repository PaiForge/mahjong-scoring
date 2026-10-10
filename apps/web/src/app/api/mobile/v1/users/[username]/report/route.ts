import { handleReportUser } from "@/lib/mobile-api/moderation";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 相手を通報する（アプリ向け。本体は `handleReportUser`） */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/users/[username]/report">,
) {
  const { username } = await params;
  return handleReportUser(request, username);
}

export const OPTIONS = mobilePreflight;
