import { handleRecordGooglePurchase } from "@/lib/mobile-api/google-iap";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** Google Play の購入を記録する（アプリ向け。本体は `handleRecordGooglePurchase`） */
export function POST(request: Request) {
  return handleRecordGooglePurchase(request);
}

export const OPTIONS = mobilePreflight;
