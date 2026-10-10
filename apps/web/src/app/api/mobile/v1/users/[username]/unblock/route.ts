import { handleUnblockUser } from "@/lib/mobile-api/moderation";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** ブロックを解除する（アプリ向け。本体は `handleUnblockUser`） */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/users/[username]/unblock">,
) {
  const { username } = await params;
  return handleUnblockUser(request, username);
}

export const OPTIONS = mobilePreflight;
