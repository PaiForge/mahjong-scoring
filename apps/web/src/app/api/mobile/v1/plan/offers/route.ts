import { handleReadPlanOffers } from "@/lib/mobile-api/plan";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** 販売中の商品の一覧を返す（アプリ向け・認証なし。本体は `handleReadPlanOffers`） */
export function GET() {
  return handleReadPlanOffers();
}

export const OPTIONS = mobilePreflight;
