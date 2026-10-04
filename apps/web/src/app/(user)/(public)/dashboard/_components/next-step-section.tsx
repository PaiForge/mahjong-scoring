import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";
import { beltBorderClass, beltButtonVarsClass } from "@/lib/ranks/belt-colors";
import type {
  Journey,
  JourneyStep,
} from "@mahjong-scoring/features/journey/journey";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

import { journeyStepHref, journeyStepTitle } from "../../_lib/journey-step";
import { RankStageProgress } from "../../dojo/_components/rank-stage-progress";

interface NextStepSectionProps {
  readonly journey: Journey;
}

/** 翻訳関数の最小の形（名前空間ごとの `getTranslations` の戻り値をこれで受ける） */
type Translator = Awaited<ReturnType<typeof getTranslations>>;

/** 一歩の行き先と文言 */
interface StepPresentation {
  readonly href: string;
  /** ボタンの文言。対象の名前を含む（「「子のツモ」のレッスンを始める」） */
  readonly cta: string;
}

/**
 * 一歩の種類ごとに、行き先とボタンの文言を組む
 *
 * 対象の名前と行き先はレッスンの完了画面と共有する（`_lib/journey-step`）。
 */
function presentStep(
  step: JourneyStep,
  isFresh: boolean,
  t: Translator,
  tAll: Translator,
): StepPresentation {
  const title = journeyStepTitle(step, tAll);
  const href = journeyStepHref(step);
  const key =
    step.kind === "lesson" && isFresh ? "lesson.firstCta" : `${step.kind}.cta`;
  return { href, cta: t(`steps.${key}`, { title }) };
}

/**
 * ダッシュボードの「次にやること」セクション
 * 次にやること
 *
 * Server Component。黒帯への道（features の `buildJourney`）が決めた
 * 今やること 1 つを、次に取る級の帯色で縁取ったカードに出す。
 * 「次の目標：5級 — 満貫以上の点数計算ができること」→ その級の進み具合
 * （学ぶ・練習する・認定される）→ ボタン、の順。何をするかはボタンが対象の
 * 名前ごと言う。以前はボタンの上に「次は「子のツモ」をレッスンで学びましょう。」
 * のような一文を置いていたが、ボタンの言い換えにしかならず、カードを読む
 * 量を増やすだけだったため外した。
 *
 * 見出しは誰にでも「次にやること」。以前は何も始めていない人だけ
 * 「黒帯への第一歩」にしていたが、言い回しが大げさで何をする欄かが
 * 伝わらないため揃えた。まだ何も始めていない人はボタンを
 * 最初のレッスン向けにし、ボタンの下のリンクを「自分で練習を選ぶ」
 * （練習一覧）にする。それ以外は「黒帯までの
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
  const step = presentStep(nextStep, isFresh, t, tAll);

  return (
    <section className="space-y-4" data-next-step={nextStep.kind}>
      <SectionTitle>{t("title")}</SectionTitle>

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

        <RankStageProgress journey={current} tRanks={tRanks} />

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
