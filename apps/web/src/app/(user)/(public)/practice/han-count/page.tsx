/**
 * 翻数即答 説明
 *
 * @description
 * 翻数即答練習の説明ページ。練習の概要を表示し、
 * 練習開始ボタンを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から翻数即答を選択して遷移
 * 2. 練習の説明と「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hanCountChallenge");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default function HanCountPage() {
  return <PracticeIntroContent namespace="hanCountChallenge" slug="han-count" showLearnLink={false} />;
}
