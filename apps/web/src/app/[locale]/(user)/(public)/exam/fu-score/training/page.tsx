/**
 * 昇級試験（30〜50符の点数計算） 模試
 *
 * @description
 * 昇級試験の模試（トレーニング）。本番と同じ出題条件・回答形式を時間無制限・
 * 記録なしで解き、1 問ごとに正解を確認してから次へ進む。合否の判定も段級位の
 * 付与も無いため受験資格のガードは掛けず、未ログインでも受けられる
 * （cookie を読まないので静的に配信できる）。
 *
 * @flow
 * 1. 説明ページの「模試を受ける」ボタンから遷移
 * 2. カウントダウンなしで即座に出題が始まる
 * 3. 点数を回答して判定、正解の点数を確認してから次の問題へ進む
 * 4. 「終了」を押すと説明ページへ戻る。末尾の導線から本番の試験へも進める
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticeTrainingMetadata } from "@/app/[locale]/(user)/(public)/practice/_lib/metadata";
import { FuScoreExamTrainingView } from "../_components/fu-score-exam-training-view";
import { prepareRouteLocale } from "@/i18n/route-locale";
import { ExamGateLinksProvider } from "../../_components/exam-gate-links";
import { resolveExamGateLinks } from "../../_lib/exam-gate-links";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/exam/fu-score/training">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/exam/fu-score/training");
  return createPracticeTrainingMetadata(PRACTICE_SLUG.fuScoreExam, { locale });
}

export default async function FuScoreExamTrainingPage({
  params,
}: PageProps<"/[locale]/exam/fu-score/training">) {
  const locale = await prepareRouteLocale(params, "/exam/fu-score/training");
  // 末尾の本番への導線（受験ゲート）が、登録・道場をこの言語で張れるようにする
  return (
    <ExamGateLinksProvider links={resolveExamGateLinks(locale)}>
      <FuScoreExamTrainingView />
    </ExamGateLinksProvider>
  );
}
