import { handleBlockUser } from "@/lib/mobile-api/moderation";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 相手をブロックする（アプリ向け。本体は `handleBlockUser`） */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/users/[username]/block">,
) {
  const { username } = await params;
  return handleBlockUser(request, username);
}

export const OPTIONS = mobilePreflight;
