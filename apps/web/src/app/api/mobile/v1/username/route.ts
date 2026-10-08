import { mobilePreflight } from "@/lib/mobile-api/response";
import { handleRegisterUsername } from "@/lib/mobile-api/username";

/** ユーザー名を決めてプロフィールを作る（アプリ向け。本体は `handleRegisterUsername`） */
export function POST(request: Request) {
  return handleRegisterUsername(request);
}

export const OPTIONS = mobilePreflight;
