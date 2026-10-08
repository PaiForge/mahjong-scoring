import { handleDeleteAccount } from "@/lib/mobile-api/delete-account";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** アカウントの退会を受け付ける（アプリ向け。本体は `handleDeleteAccount`） */
export function POST(request: Request) {
  return handleDeleteAccount(request);
}

export const OPTIONS = mobilePreflight;
