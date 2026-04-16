import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yaku");
  return createMetadata({ title: t("title"), description: t("description") });
}

/**
 * 役判定練習 説明
 *
 * @description
 * 役判定練習の説明ページ。役判定についての概要を表示し、
 * 練習開始および教本ページへのリンクを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から役を選択して遷移
 * 2. 練習の説明と「開始」ボタン、教本ページへのリンクが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
export default function YakuPage() {
  return <PracticeIntroContent namespace="yaku" slug="yaku" />;
}
