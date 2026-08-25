import { getTranslations } from "next-intl/server";

import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { rankRequiringMenu } from "@/lib/ranks/registry";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";

interface ExamCtaCardProps {
  /** 昇級試験の練習スラッグ（CURRICULUM の `examSlug`） */
  readonly slug: PracticeMenuSlug;
}

/**
 * 教本章末の昇級試験 CTA
 * 昇級試験導線
 *
 * Server Component。試験（練習）からランクを逆引きし（`rankRequiringMenu`）、
 * ランク名・合格基準・合格条件を表示する。ランク名や合格点はレジストリが正典で、
 * ここには文言の組み立てだけを置く。
 *
 * どのランクの要件にも紐付かない練習が指定された場合は何も描画しない
 * （試験の廃止時に CTA だけ残る事故を防ぐ）。
 */
export async function ExamCtaCard({ slug }: ExamCtaCardProps) {
  const menu = practiceMenuBySlug(slug);
  const exam = rankRequiringMenu(menu.menuType);
  if (!exam) return undefined;

  const t = await getTranslations("ranks");
  const rankName = t(`names.${exam.rank.slug}`);

  return (
    <section className="space-y-4">
      <SectionTitle>{t("examCta.title", { rank: rankName })}</SectionTitle>
      <div className="space-y-4 rounded-xl border-3 border-ink bg-white p-5">
        <p className="text-sm leading-relaxed text-surface-700">
          {t("examCta.lead")}
        </p>
        <dl className="space-y-1 text-sm text-surface-700">
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold">
              {t("examCta.criterionLabel")}:
            </dt>
            <dd>{t(`criteria.${exam.rank.slug}`)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-bold">{t("passConditionsTitle")}:</dt>
            <dd>
              {t("passConditions", {
                timeLimit: menu.timeLimit,
                minScore: exam.requirement.minScore,
                mistakeLimit: menu.mistakeLimit,
              })}
            </dd>
          </div>
        </dl>
        <LinkButton href={`/practice/${slug}`} size="lg" fullWidth>
          <PlayIcon className="size-4" />
          {t("examCta.start")}
        </LinkButton>
      </div>
    </section>
  );
}
