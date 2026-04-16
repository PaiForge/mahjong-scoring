import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { JantouFuPlayView } from "../_components/jantou-fu-play-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jantouFu");
  return createMetadata({ title: t("title") });
}

/**
 * 雀頭符練習 プレイ
 *
 * @description
 * 雀頭符練習のプレイページ。場風・自風の条件のもと、
 * 指定された符になる雀頭を4択から選択する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 場風・自風が表示され、正しい符の雀頭を4択から選択
 * 3. 制限時間経過またはミス3回で終了
 * 4. スコアを保存し、result ページへリダイレクト
 */
export default function JantouFuPlayPage() {
  return <JantouFuPlayView />;
}
