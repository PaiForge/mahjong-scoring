import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillIntroContent } from "../_components/drill-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yaku");
  return createMetadata({ title: t("title"), description: t("description") });
}

/**
 * @description
 * 役ドリルの説明ページ。役判定についての概要を表示し、
 * ドリル開始および教本ページへのリンクを提供する。
 *
 * @flow
 * 1. ユーザーがドリル一覧から役を選択して遷移
 * 2. ドリルの説明と「開始」ボタン、教本ページへのリンクが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
export default function YakuPage() {
  return <DrillIntroContent namespace="yaku" slug="yaku" />;
}
