import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { beltBorderClass, beltButtonVarsClass } from "@/lib/ranks/belt-colors";
import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  countProgress,
  type Journey,
  type JourneyStep,
  type RankJourney,
} from "@mahjong-scoring/features/journey/journey";
import { practiceTitleKey } from "@mahjong-scoring/features/practice/catalog";
import { practiceMenuBySlug } from "@mahjong-scoring/features/practice-menu-types";
import { rankTier } from "@mahjong-scoring/features/ranks/registry";
import {
  DOJO_PATH,
  chapterHref,
  lessonHref,
  practiceHref,
} from "@mahjong-scoring/features/routes";

interface NextStepSectionProps {
  readonly journey: Journey;
}

/** 翻訳関数の最小の形（名前空間ごとの `getTranslations` の戻り値をこれで受ける） */
type Translator = Awaited<ReturnType<typeof getTranslations>>;

/** 一歩の行き先と文言 */
interface StepPresentation {
  readonly href: string;
  /** 「次は「子のツモ」の章を読みましょう。」のような一文 */
  readonly lead: string;
  /** ボタンの文言 */
  readonly cta: string;
}

/**
 * 一歩の種類ごとに、行き先・一文・ボタンの文言を組む
 *
 * 対象の名前（章・練習・試験）は各レジストリの辞書キーから引き、ここでは
 * 組み立てだけを持つ。
 */
function presentStep(
  step: JourneyStep,
  current: RankJourney,
  isFresh: boolean,
  t: Translator,
  tAll: Translator,
): StepPresentation {
  switch (step.kind) {
    case "lesson": {
      const chapter = getChapterBySlug(step.chapterSlug);
      const title = chapter
        ? tAll(`learnCurriculum.${getChapterI18nPath(chapter)}.title`)
        : "";
      return {
        href: lessonHref(step.lessonSlug),
        lead: isFresh
          ? t("steps.lesson.firstLead", { title })
          : t("steps.lesson.lead", { title }),
        cta: isFresh ? t("steps.lesson.firstCta") : t("steps.lesson.cta"),
      };
    }
    case "read": {
      const chapter = getChapterBySlug(step.chapterSlug);
      const title = chapter
        ? tAll(`learnCurriculum.${getChapterI18nPath(chapter)}.title`)
        : "";
      return {
        href: chapterHref(step.chapterSlug),
        lead: t("steps.read.lead", { title }),
        cta: t("steps.read.cta"),
      };
    }
    case "practice": {
      const menu = practiceMenuBySlug(step.slug);
      const practiceTitle = tAll(`practice.${practiceTitleKey(step.slug)}`);
      // バリアント付きは練習名にバリアント名を添える（章末の練習リンクと同じ）
      const title =
        step.variant !== undefined && menu.hasSetup
          ? `${practiceTitle}（${tAll(`${menu.namespace}.variants.${step.variant}.label`)}）`
          : practiceTitle;
      return {
        href: practiceHref(step.slug, step.variant),
        lead: t("steps.practice.lead", { title }),
        cta: t("steps.practice.cta"),
      };
    }
    case "exam": {
      const rankName = tAll(`ranks.names.${current.rank.slug}`);
      const title = tAll(`ranks.examTitle.${rankTier(current.rank.slug)}`, {
        rank: rankName,
      });
      return {
        href: practiceHref(step.slug),
        lead: t("steps.exam.lead", { title }),
        cta: t("steps.exam.cta"),
      };
    }
  }
}

/**
 * ダッシュボードの「次の一歩」セクション
 * 次の一歩
 *
 * Server Component。黒帯への道（features の `buildJourney`）が決めた
 * 今やること 1 つを、次に取る級の帯色で縁取ったカードに出す。
 * 「次の目標：5級 — 満貫以上の点数計算ができること」→ 一歩の一文 →
 * その級の進み具合（学ぶ・練習する・認定される）→ ボタン、の順。
 *
 * まだ何も始めていない人には見出しを「黒帯への第一歩」にし、ボタンの下の
 * リンクを「自分で練習を選ぶ」（練習一覧）にする。それ以外は「黒帯までの
 * 道を見る」（道場）。使い続けるほど中身が変わるカードで、初回限定の
 * カードは別に持たない。
 *
 * 帯色の枠とボタン（`variant="belt"`）は昇級試験カード（`ExamCtaCard`）と
 * 同じ理由 — 級の名前を掲げたカードに既定の緑を回すと、緑がその級の色に
 * 見えてしまう。
 *
 * 全級取得済み（`nextStep` が無い）なら何も描画しない。
 */
export async function NextStepSection({ journey }: NextStepSectionProps) {
  const { current, nextStep, isFresh } = journey;
  if (current === undefined || nextStep === undefined) return undefined;

  const [t, tRanks, tAll] = await Promise.all([
    getTranslations("dashboard.nextStep"),
    getTranslations("ranks"),
    getTranslations(),
  ]);

  const rankSlug = current.rank.slug;
  const step = presentStep(nextStep, current, isFresh, t, tAll);
  const learn = countProgress(current.chapters);
  const practice = countProgress(current.practices);

  return (
    <section className="space-y-4" data-next-step={nextStep.kind}>
      <SectionTitle>{isFresh ? t("firstStepTitle") : t("title")}</SectionTitle>

      <div
        data-belt-slug={rankSlug}
        className={`space-y-4 rounded-xl border-3 bg-white p-5 ${beltBorderClass(rankSlug)}`}
      >
        <div className="flex items-center gap-3">
          <BeltBadge slug={rankSlug} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-surface-500">
              {t("goalLabel")}
            </p>
            <p className="text-base font-bold text-surface-900">
              {t("goal", {
                rank: tRanks(`names.${rankSlug}`),
                criterion: tRanks(`criteria.${rankSlug}`),
              })}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-surface-700">{step.lead}</p>

        {/* その級の進み具合。前提章を持たない級（初段）では学ぶ・練習するが
            0 件なので、数えるものがある段だけ並べる */}
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-600">
          {learn.total > 0 && (
            <div className="flex gap-1">
              <dt className="font-bold">{tRanks("stages.learn")}</dt>
              <dd className="tabular-nums">
                {tRanks("stageCount", { done: learn.done, total: learn.total })}
              </dd>
            </div>
          )}
          {practice.total > 0 && (
            <div className="flex gap-1">
              <dt className="font-bold">{tRanks("stages.practice")}</dt>
              <dd className="tabular-nums">
                {tRanks("stageCount", {
                  done: practice.done,
                  total: practice.total,
                })}
              </dd>
            </div>
          )}
          <div className="flex gap-1">
            <dt className="font-bold">{tRanks("stages.exam")}</dt>
            <dd>
              {tRanks(
                current.exam.done ? "stageExamPassed" : "stageExamNotTaken",
              )}
            </dd>
          </div>
        </dl>

        <div className={`flex flex-col ${SUB_LINK_GAP}`}>
          <LinkButton
            href={step.href}
            variant="belt"
            size="lg"
            fullWidth
            className={beltButtonVarsClass(rankSlug)}
            trailingIcon={<ChevronRightIcon className="size-4" />}
          >
            {step.cta}
          </LinkButton>
          <div className="text-center">
            {isFresh ? (
              <Link href="/practice" className={`text-sm ${TEXT_LINK_CLASSES}`}>
                {t("choosePractice")}
              </Link>
            ) : (
              <Link href={DOJO_PATH} className={`text-sm ${TEXT_LINK_CLASSES}`}>
                {t("viewJourney")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
