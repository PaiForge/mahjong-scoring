import { getTranslations } from "next-intl/server";

import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import {
  PRACTICE_START_CTA_FRAME_CLASS,
  PracticeStartCtaDivider,
  TrainingStartBlock,
} from "../../practice/_components/practice-start-cta";
import { ExamStartGate } from "./exam-start-gate";

interface ExamStartCtaProps {
  /** 昇級試験の練習スラッグ（例: "mangan-exam"） */
  readonly slug: PracticeMenuSlug;
  /** 本番（play ページ）のリンク先 */
  readonly playHref: string;
  /** 模試（training ページ）のリンク先 */
  readonly trainingHref: string;
}

/**
 * 昇級試験の開始導線（本番 / OR 区切り / 模試）
 * 昇級試験開始導線
 *
 * 練習の開始導線（{@link import("../../practice/_components/practice-start-cta").PracticeStartCta}）
 * と同じ 3 ブロック構成。練習の「チャレンジ / トレーニング」の関係を試験に
 * そのまま当てはめたもので、本番 = チャレンジ（合否判定・段級位の付与）、
 * 模試 = トレーニング（時間無制限・記録なし・正解を読ませて次へ）。
 *
 * 本番のボタンは受験ゲート（{@link ExamStartGate}）が資格に応じて出し分ける。
 * 模試にはゲートを掛けない — 記録も段級位の付与も無く、ガードが守っている
 * もの（級の順序）に触れないため。受験できない人にも「まず模試で腕試し」の
 * 導線が残る。
 *
 * Server Component。模試側の文言はここで引き、本番側はクライアントの
 * ゲートが自分で引く（資格の解決を待つ間もこのブロックの寸法は変わらない）。
 */
export async function ExamStartCta({
  slug,
  playHref,
  trainingHref,
}: ExamStartCtaProps) {
  const [tp, tExamTraining] = await Promise.all([
    getTranslations("practice"),
    getTranslations("examTraining"),
  ]);

  return (
    <div className={PRACTICE_START_CTA_FRAME_CLASS}>
      <ExamStartGate slug={slug} playHref={playHref} />

      <PracticeStartCtaDivider label={tp("orDivider")} />

      <TrainingStartBlock
        href={trainingHref}
        label={tExamTraining("startButton")}
        hint={tExamTraining("hint")}
      />
    </div>
  );
}
