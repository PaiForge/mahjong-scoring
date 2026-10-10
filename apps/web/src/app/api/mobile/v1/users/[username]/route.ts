import { handleReadPublicProfile } from "@/lib/mobile-api/public-profile";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** ある人の公開プロフィールを返す（アプリ向け。本体は `handleReadPublicProfile`） */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/mobile/v1/users/[username]">,
) {
  const { username } = await params;
  return handleReadPublicProfile(request, username);
}

export const OPTIONS = mobilePreflight;
