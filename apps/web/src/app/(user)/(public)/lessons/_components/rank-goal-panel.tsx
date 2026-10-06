import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import {
  DOJO_PATH,
  practiceHref,
  practiceTrainingHref,
} from "@mahjong-scoring/features/routes";

import { journeyStepTitle } from "@mahjong-scoring/features/journey/journey-step";

import { RankProgressSummary } from "./rank-progress-summary";

/** 見出しの id。完了画面に 1 つしか出ないので固定でよい */
const HEADING_ID = "rank-goal-panel-title";

interface RankGoalPanelProps {
  readonly rankSlug: RankSlug;
  /** その級の昇級試験 */
  readonly examSlug: PracticeMenuSlug;
}

/**
 * 級の最後のレッスンの完了画面の「昇級試験まで」
 * 昇級試験までのパネル
 *
 * Server Component。後ろにレッスンが無いレッスン（5級なら役）では
 * 「次のレッスン」のプレビューを出せないので、代わりに級のゴールまでの
 * 残りを見せる。主導線（次の一歩のボタン）はこのパネルの上に今のまま置き、
 * ホーム・道場と同じ一歩を指す。ここで試験を主導線にしない — 次の一歩は
 * `buildJourney` に一本化していて、レッスンの画面だけ試験を指すと
 * ダッシュボードと食い違う。
 *
 * 試験は「順序は案内であって強制ではない」ので入口として見せ、記録も
 * ガードも無い模試を「先に試す」入口として添える。練習は 1 つずつ並べない —
 * すぐ下の「関連する練習」と同じ練習が 2 度出る。全体の道筋は道場が持つ。
 *
 * 枠と見出し帯は「次のレッスン」のプレビューと同じ体裁で、同じ位置に出る
 * ものが同じ形をしている。
 */
export async function RankGoalPanel({
  rankSlug,
  examSlug,
}: RankGoalPanelProps) {
  const [t, tAll] = await Promise.all([
    getTranslations("lessons.rankGoal"),
    getTranslations(),
  ]);
  const rank = tAll(`ranks.names.${rankSlug}`);

  return (
    <section
      aria-labelledby={HEADING_ID}
      className="overflow-hidden rounded-panel border border-panel bg-white"
      data-testid="rank-goal-panel"
    >
      <h3
        id={HEADING_ID}
        className="border-b border-panel bg-primary-50 px-4 py-3 text-sm font-bold text-surface-700"
      >
        {t("title", { rank })}
      </h3>
      <div className="space-y-4 px-4 py-4">
        <p className="text-sm leading-relaxed text-surface-700">
          {t("lead", { rank })}
        </p>
        <RankProgressSummary />
        <div className={`flex flex-col ${SUB_LINK_GAP}`}>
          <LinkRowList>
            <LinkRow
              href={practiceHref(examSlug)}
              title={journeyStepTitle({ kind: "exam", slug: examSlug }, tAll)}
              description={t("examDescription")}
            />
          </LinkRowList>
          <div className="flex flex-col items-center gap-3 text-sm">
            <Link
              href={practiceTrainingHref(examSlug)}
              className={TEXT_LINK_CLASSES}
            >
              {t("training")}
            </Link>
            <Link href={DOJO_PATH} className={TEXT_LINK_CLASSES}>
              {t("dojo")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
