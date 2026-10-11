import { handleRecordAppleTransaction } from "@/lib/mobile-api/apple-iap";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** App Store の署名付き取引を購入として記録する（アプリ向け。本体は `handleRecordAppleTransaction`） */
export function POST(request: Request) {
  return handleRecordAppleTransaction(request);
}

export const OPTIONS = mobilePreflight;
