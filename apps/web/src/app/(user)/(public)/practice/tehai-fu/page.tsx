import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { DrillIntroContent } from "../_components/drill-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu");
  return createMetadata({ title: t("title"), description: t("description") });
}

/**
 * @description
 * 手牌符ドリルの説明ページ。手牌の符計算についての概要を表示し、
 * ドリル開始および教本ページへのリンクを提供する。
 *
 * @flow
 * 1. ユーザーがドリル一覧から手牌符を選択して遷移
 * 2. ドリルの説明と「開始」ボタン、教本ページへのリンクが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
export default function TehaiFuPage() {
  return <DrillIntroContent namespace="tehaiFu" slug="tehai-fu" />;
}
