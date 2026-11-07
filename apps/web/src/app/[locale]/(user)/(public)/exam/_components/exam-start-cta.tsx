import { getTranslations } from "next-intl/server";

import { currentLocale } from "@/i18n/current-locale";
import { localizedHref } from "@/i18n/public-path";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { isQuotaMenu } from "@mahjong-scoring/features/quota/limits";
import { PracticeEntryQuota } from "../../practice/_components/practice-entry-quota";
import {
  PRACTICE_START_CTA_FRAME_CLASS,
  PracticeStartCtaDivider,
  TrainingStartBlock,
} from "../../practice/_components/practice-start-cta";
import { resolveExamGateLinks } from "../_lib/exam-gate-links";
import { ExamGateLinksProvider } from "./exam-gate-links";
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
 * 導線が残る。ただし回数制限の対象の模試（1級・初段。`isQuotaMenu`）は
 * 1 日の無料枠があるので、ボタンの下に今日の残りを出す（和了形の点数計算の
 * 設定画面と同じ {@link PracticeEntryQuota}）。
 *
 * Server Component。模試側の文言はここで引き、本番側はクライアントの
 * ゲートが自分で引く（資格の解決を待つ間もこのブロックの寸法は変わらない）。
 *
 * 言語は自分で取る（`currentLocale()`。ページの `prepareRouteLocale` の後に
 * 描かれる前提）。本番・模試の行き先はページの言語の接頭辞を付けてから渡す。
 * play / training は説明ページと同じ公開単位で、説明ページを出している言語では
 * 必ず出しているため、公開状態を引き直さず `localizedHref` で付ける（既に
 * 接頭辞の付いた href には二重に付かないので、呼び出し側が付けて渡しても同じ）。
 * 受験できないときの登録・道場の行き先は公開状態で解決し（`resolveExamGateLinks`）、
 * Provider でゲートへ渡す。
 */
export async function ExamStartCta({
  slug,
  playHref,
  trainingHref,
}: ExamStartCtaProps) {
  const [tp, tExamTraining, locale] = await Promise.all([
    getTranslations("practice"),
    getTranslations("examTraining"),
    currentLocale(),
  ]);

  return (
    <div className={PRACTICE_START_CTA_FRAME_CLASS}>
      <ExamGateLinksProvider links={resolveExamGateLinks(locale)}>
        <ExamStartGate slug={slug} playHref={localizedHref(playHref, locale)} />
      </ExamGateLinksProvider>

      <PracticeStartCtaDivider label={tp("orDivider")} />

      <TrainingStartBlock
        href={localizedHref(trainingHref, locale)}
        label={tExamTraining("startButton")}
        hint={tExamTraining("hint")}
      />
      {isQuotaMenu(slug) && <PracticeEntryQuota menu={slug} />}
    </div>
  );
}
