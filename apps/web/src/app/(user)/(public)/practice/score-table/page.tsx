/**
 * 点数表早引き練習 説明・設定
 *
 * @description
 * 点数表早引き練習の説明＋出題設定ページ。問題方式のデモに加え、
 * バリアント（子・満貫未満 / 親・満貫未満 / 全部）を選んでチャレンジ／
 * トレーニングを開始できる。教本（/learn/mangan-* 等）からバリアント付きで
 * 遷移した場合は、それが初期選択になる。バリアントはクライアント側で
 * `useSearchParams()` から読む（サーバーで `searchParams` を読むとルートが
 * 動的になり、初回表示が `loading.tsx` のスケルトンを経由してしまうため）。
 *
 * @flow
 * 1. 練習一覧、または学習ガイドの練習リンクから遷移
 * 2. 問題方式のデモとバリアントの選択肢が表示される
 * 3. バリアントを選び「開始」または「トレーニング」で play / training へ遷移
 */
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeMetadata } from "../_lib/metadata";
import { PracticeIntroContent } from "../_components/practice-intro-content";
import { ScoreTableHowToPlay } from "./_components/score-table-how-to-play";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata(PRACTICE_SLUG.scoreTable);
}

export default function ScoreTablePage() {
  return (
    <PracticeIntroContent
      namespace="scoreTableChallenge"
      slug={PRACTICE_SLUG.scoreTable}
      howToPlay={<ScoreTableHowToPlay />}
    />
  );
}
