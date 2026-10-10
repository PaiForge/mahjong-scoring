import {
  handleReadProfile,
  handleUpdateProfile,
} from "@/lib/mobile-api/profile";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** プロフィール編集の材料を返す（アプリ向け。本体は `handleReadProfile`） */
export function GET(request: Request) {
  return handleReadProfile(request);
}

/** プロフィールを更新する（アプリ向け。本体は `handleUpdateProfile`） */
export function POST(request: Request) {
  return handleUpdateProfile(request);
}

export const OPTIONS = mobilePreflight;
