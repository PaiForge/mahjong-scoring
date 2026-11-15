import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { ArrowRightIcon } from "@/app/[locale]/(user)/_components/icons/arrow-right-icon";
import { ClockIcon } from "@/app/[locale]/(user)/_components/icons/clock-icon";
import { InfinityIcon } from "@/app/[locale]/(user)/_components/icons/infinity-icon";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { PlanPerkCard } from "@/app/[locale]/(user)/_components/plan-perk-card";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import {
  AGARI_SCORE_PRACTICE_HREF,
  practiceTrainingHref,
  TENPAI_SCORE_PRACTICE_HREF,
} from "@mahjong-scoring/features/routes";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@mahjong-scoring/features/settings/preference-anchors";

type BenefitsTranslator = Awaited<
  ReturnType<typeof getTranslations<"mypagePlan">>
>;
type PerksTranslator = Awaited<ReturnType<typeof getTranslations<"plan">>>;

/** 特典のカードに並べる、その特典が効く機能へのリンク 1 本 */
interface BenefitLink {
  readonly path: string;
  readonly label: string;
}

/** 特典 1 つのカードの中身 */
interface BenefitCard {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly links: readonly BenefitLink[];
}

/**
 * 特典ごとのカードの中身
 *
 * 見出しと説明は料金ページの「Pro でできること」（`plan.perks.*`）と同じ文言を引く。
 * 買う前に読んだ説明と同じ言葉で「使えるようになったもの」を示すため。リンクは
 * 特典が実際に効く画面へ張る — 回数制限が外れる練習 3 種と、計測・手牌の表示を
 * 切り替える場所。`PlanBenefit` を足したら、ここが網羅性の検査で落ちる。
 */
function benefitCardOf(
  benefit: PlanBenefit,
  t: BenefitsTranslator,
  tPerks: PerksTranslator,
): BenefitCard {
  switch (benefit) {
    case PlanBenefit.UnlimitedPractice:
      return {
        icon: <InfinityIcon className="size-7" />,
        title: tPerks("perks.unlimitedTitle"),
        description: tPerks("perks.unlimited"),
        links: [
          {
            path: AGARI_SCORE_PRACTICE_HREF,
            label: t("benefits.links.agariScore"),
          },
          {
            path: TENPAI_SCORE_PRACTICE_HREF,
            label: t("benefits.links.tenpaiScore"),
          },
          {
            path: practiceTrainingHref(PRACTICE_SLUG.fuScoreExam),
            label: t("benefits.links.fuScoreExamTraining"),
          },
          {
            path: practiceTrainingHref(PRACTICE_SLUG.scoreExam),
            label: t("benefits.links.scoreExamTraining"),
          },
        ],
      };
    case PlanBenefit.PracticeTools:
      return {
        icon: <ClockIcon className="size-7" />,
        title: tPerks("perks.toolsTitle"),
        description: tPerks("perks.tools"),
        links: [
          {
            path: AGARI_SCORE_PRACTICE_HREF,
            label: t("benefits.links.measureTime"),
          },
          {
            path: preferencesHref(PREFERENCE_ANCHORS.tileOrientation),
            label: t("benefits.links.handDisplay"),
          },
        ],
      };
    default: {
      const exhaustive: never = benefit;
      return exhaustive;
    }
  }
}

/** カードを並べる順（料金ページの「Pro でできること」と同じ順） */
const BENEFIT_ORDER: readonly PlanBenefit[] = [
  PlanBenefit.UnlimitedPractice,
  PlanBenefit.PracticeTools,
];

interface PlanBenefitsSectionProps {
  /** いま持っている特典（`getActiveBenefits`） */
  readonly benefits: ReadonlySet<PlanBenefit>;
  readonly locale: SupportedLocale;
}

/**
 * 購入状況の「使える機能」
 * 保有特典一覧
 *
 * Pro（購入）でも VIP（付与）でも、いま有効な特典をカードで見せ、その特典が効く
 * 画面へのリンクを添える。「Pro になって何ができるか」を文章で読ませず、
 * 料金ページと同じ絵（アイコン・見出し）で見せて、そのまま使いに行けるようにする。
 *
 * 出すのはプランの特典の一覧（`PLANS.pro.benefits`）ではなく、その人が実際に
 * 持っている特典。買い切りは購入時点の特典に固定され（`purchases.benefits` の
 * スナップショット）、付与も行ごとに特典を持つため、プランの今の定義を出すと
 * 使えない機能を「使える」と見せ得る。特典が 1 つも無ければ節ごと出さない。
 *
 * リンク先は公開状態の表から張る（`resolveNavTargetFor`）。英語のページから
 * 英語で出していない練習へは日本語のページへ張り、「日本語のみ」の印を添える。
 */
export async function PlanBenefitsSection({
  benefits,
  locale,
}: PlanBenefitsSectionProps) {
  if (benefits.size === 0) return null;
  const [t, tPerks, tNav] = await Promise.all([
    getTranslations("mypagePlan"),
    getTranslations("plan"),
    getTranslations("nav"),
  ]);
  const cards = BENEFIT_ORDER.filter((benefit) => benefits.has(benefit)).map(
    (benefit) => ({ benefit, card: benefitCardOf(benefit, t, tPerks) }),
  );

  return (
    <section className="space-y-4">
      <SectionTitle>{t("benefits.title")}</SectionTitle>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(({ benefit, card }) => (
          <PlanPerkCard
            key={benefit}
            icon={card.icon}
            title={card.title}
            description={card.description}
          >
            <ul className="space-y-1.5 pt-2 text-sm">
              {card.links.map((link) => {
                const target = resolveNavTargetFor(link.path, locale);
                return (
                  <li key={link.path + link.label} className="flex gap-1.5">
                    <ArrowRightIcon className="mt-[0.2em] size-4 shrink-0 text-brand-subtle-foreground" />
                    <span>
                      <LocaleNavLink
                        navTarget={target}
                        linkKind="plain"
                        className={TEXT_LINK_CLASSES}
                      >
                        {link.label}
                      </LocaleNavLink>
                      {target.crossLocale && (
                        <JapaneseOnlyMark
                          label={tNav("language.japaneseOnly")}
                        />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </PlanPerkCard>
        ))}
      </ul>
    </section>
  );
}
