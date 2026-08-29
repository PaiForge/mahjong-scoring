import { getTranslations } from "next-intl/server";

import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import {
  beltBorderClass,
  beltClass,
  beltForegroundClass,
} from "@/lib/ranks/belt-colors";
import { rankRequiringMenu } from "@/lib/ranks/registry";
import { practiceHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";

interface ExamCtaCardProps {
  /** 昇級試験の練習スラッグ（CURRICULUM の `examSlug`） */
  readonly slug: PracticeMenuSlug;
  /**
   * リード文の上書き（翻訳済み文字列）。既定の `ranks.examCta.lead` は
   * 「この章の内容を〜」と章末を前提にした文言のため、教本の外
   * （道場ページ等）から使うときはここで差し替える。
   */
  readonly lead?: string;
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
export async function ExamCtaCard({ slug, lead }: ExamCtaCardProps) {
  const menu = practiceMenuBySlug(slug);
  const exam = rankRequiringMenu(menu.menuType);
  if (!exam) return undefined;

  const t = await getTranslations("ranks");
  const rankName = t(`names.${exam.rank.slug}`);

  return (
    <section className="space-y-4">
      {/* 見出しも級の色。このアプリで唯一「特定の段級位のもの」である見出しで、
          既定の緑のままだと隣のオレンジの枠と競合して見える */}
      <SectionTitle
        toneClass={`${beltClass(exam.rank.slug)} ${beltForegroundClass(exam.rank.slug)}`}
      >
        {t("examCta.title", { rank: rankName })}
      </SectionTitle>
      {/* どの級の試験かを枠の色でも示す。既定の ink（緑）は使わない — 級名を
          掲げたカードが緑枠だと、緑がその級の色に見えてしまう。
          参考プロジェクトのランクカードは細い枠に加えて上端に帯を敷くが、
          こちらは枠自体が 3px あり、帯を足すと上辺だけ厚い不揃いに見える。 */}
      <div
        data-belt-slug={exam.rank.slug}
        className={`rounded-xl border-3 bg-white ${beltBorderClass(exam.rank.slug)}`}
      >
        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-surface-700">
            {lead ?? t("examCta.lead")}
          </p>
          <dl className="space-y-1 text-sm text-surface-700">
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold">
                {t("examCta.criterionLabel")}:
              </dt>
              <dd>{t(`criteria.${exam.rank.slug}`)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold">
                {t("passConditionsTitle")}:
              </dt>
              <dd>
                {t("passConditions", {
                  timeLimit: menu.timeLimit,
                  minScore: exam.requirement.minScore,
                  mistakeLimit: menu.mistakeLimit,
                })}
              </dd>
            </div>
          </dl>
          {/* 遷移先は試験の説明ページ（問題方式のデモと合格条件を見て、
              そこで初めてスタートする）。押した瞬間に試験が始まるわけでは
              ないため、緑 + 再生アイコンの「押して始める面」にはしない。
              白 + 右シェブロンで、詳細を見に行く導線であることを示す。

              variant は secondary ではなく quiet。secondary も白地だが枠と
              影が ink（緑）で、帯色で縁取ったこのカードの上では緑が
              その級の色と競合して浮く。 */}
          <LinkButton
            href={practiceHref(slug)}
            variant="quiet"
            size="lg"
            fullWidth
          >
            {t("examCta.viewRequirements")}
            <ChevronRightIcon className="size-4" />
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
