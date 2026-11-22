import { getTranslations } from "next-intl/server";

import { formatAdminDate } from "@/app/admin/_lib/format-date";
import type { AppUsage } from "@/lib/db";

/**
 * アプリの OS と版（`iOS 1.1.0`。版が読めなかったら OS だけ）
 * アプリOS・版表示
 */
export async function AppClientLabel({ usage }: { readonly usage: AppUsage }) {
  const t = await getTranslations("admin.userDetail.account.appPlatforms");
  // 辞書キーの例: admin.userDetail.account.appPlatforms.ios
  const platform = usage.platform === "android" ? t("android") : t("ios");
  return <>{usage.appVersion ? `${platform} ${usage.appVersion}` : platform}</>;
}

/**
 * ユーザー一覧の「アプリ」列: 最後にアプリで使った OS と日付。記録が無ければ「-」
 * アプリ利用列
 *
 * 記録はアプリ向け API の認証を通った要求から取る（`lib/mobile-api/app-usage.ts`）。
 * 記録を始める前の利用は無いので、「-」は「アプリを使っていない」とは限らない。
 */
export async function AppUsageSummary({
  usage,
}: {
  readonly usage: AppUsage | undefined;
}) {
  if (!usage) return <span className="text-surface-400">-</span>;
  return (
    <span className="whitespace-nowrap">
      <AppClientLabel usage={usage} />
      <span className="ml-2 text-surface-500">
        {formatAdminDate(usage.lastSeenAt)}
      </span>
    </span>
  );
}
