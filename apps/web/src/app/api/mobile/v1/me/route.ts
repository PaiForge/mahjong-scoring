import { handleReadAccount } from "@/lib/mobile-api/me";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** ログイン中のアカウントの状態を返す（アプリ向け。本体は `handleReadAccount`） */
export function GET(request: Request) {
  return handleReadAccount(request);
}

export const OPTIONS = mobilePreflight;
