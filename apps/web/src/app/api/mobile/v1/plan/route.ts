import { handleReadPlan } from "@/lib/mobile-api/plan";
import { mobilePreflight } from "@/lib/mobile-api/response";

/** プランの状態・販売中の商品・購入履歴を返す（アプリ向け。本体は `handleReadPlan`） */
export function GET(request: Request) {
  return handleReadPlan(request);
}

export const OPTIONS = mobilePreflight;
