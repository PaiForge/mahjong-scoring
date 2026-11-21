import { getTranslations } from "next-intl/server";
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core";
import type { AgariProblemPayload } from "@mahjong-scoring/core";
import type { DailyProblemAnswerState } from "@mahjong-scoring/features/daily-problem/mobile-api";
import { buildDailyProblemQuestion } from "@mahjong-scoring/features/daily-problem/question";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { DAILY_PROBLEM_HREF } from "@mahjong-scoring/features/routes";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { CheckIcon } from "@/app/[locale]/(user)/_components/icons/check-icon";
import { ChevronRightIcon } from "@/app/[locale]/(user)/_components/icons/chevron-right-icon";
import { LinkButton } from "@/app/[locale]/(user)/_components/link-button";
import { LocaleNavLink } from "@/app/[locale]/(user)/_components/locale-nav-link";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

import { TehaiHand } from "../../_components/tehai-hand";
import { linkLabel } from "./link-label";

interface DailyProblemSectionProps {
  /** 今日の問題の盤面（手牌のプレビューに使う） */
  readonly payload: AgariProblemPayload;
  /** 本人の今日の解答（最初の解答）。まだなら undefined */
  readonly answer: DailyProblemAnswerState | undefined;
  /** ページの言語。行き先をこの言語で決める */
  readonly locale: SupportedLocale;
}

/**
 * ダッシュボードの「本日の問題」セクション
 * 本日の問題カード
 *
 * Server Component。全員に同じ和了形の点数計算 1 問（日課）への入口を、
 * 「次にやること」の直下に出す。カードは手牌のプレビュー・状態の順。
 * 未解答なら緑の主ボタン「解く」（押して始める面）、解答済みなら正誤のバッジと
 * 文字リンク「もう一度解く」（解き直しても記録は変わらないので、始める面には
 * しない）。正誤のバッジは段級位状態バッジ（`RankStatusBadge`）と同じ形で、
 * 正解は「済んだ」の記号（緑の塗り + チェック）、不正解は灰の塗り。押せない印なので
 * 枠を持たない。
 *
 * 手牌のプレビューは解答の有無に依らず出す（解答済みでも今日の手を見返せる）。
 * プレビューは標準ルール（`DEFAULT_RULE_SETTINGS`）で組み立てた問題の手牌を、
 * 練習一覧の和了形のバナーと同じ渡し方（和了牌を右に分け、ツモ / ロンの札を添える）で
 * 出す。手牌はルール設定に依らないので標準ルールで足りる（サーバーは端末ローカルの
 * 設定を知らない）。組み立てに失敗したらプレビューだけ省き、カードは出す。
 *
 * 行き先はページの言語で張る（`resolveNavTargetFor`。英語では `/en/daily-problem`）。
 * 英語で未公開になったときだけ「日本語のみ」の印を添える。
 */
export async function DailyProblemSection({
  payload,
  answer,
  locale,
}: DailyProblemSectionProps) {
  const [t, tCommon, tNav] = await Promise.all([
    getTranslations("dailyProblem"),
    getTranslations("common"),
    getTranslations("nav"),
  ]);

  const built = buildDailyProblemQuestion(payload, DEFAULT_RULE_SETTINGS);
  const question = built.isOk() ? built.value : undefined;
  const target = resolveNavTargetFor(DAILY_PROBLEM_HREF, locale);
  const japaneseOnlyLabel = tNav("language.japaneseOnly");

  return (
    <section
      className="space-y-4"
      data-daily-problem={answer ? "answered" : "open"}
    >
      <SectionTitle>{t("title")}</SectionTitle>

      <div className="space-y-4 rounded-panel border border-panel bg-white p-5">
        {question && (
          <div
            aria-hidden="true"
            className="overflow-hidden rounded-lg bg-primary-800 p-3"
          >
            <TehaiHand
              tehai={question.tehai}
              agariHai={question.agariHai}
              agariLabel={question.isTsumo ? tCommon("tsumo") : tCommon("ron")}
            />
          </div>
        )}

        {answer === undefined ? (
          <LinkButton
            navTarget={target}
            variant="primary"
            size="lg"
            fullWidth
            trailingIcon={<ChevronRightIcon className="size-4" />}
          >
            {linkLabel(t("card.start"), target, japaneseOnlyLabel)}
          </LinkButton>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              data-daily-problem-result={
                answer.isCorrect ? "correct" : "incorrect"
              }
              className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2.5 text-xs leading-none font-bold ${answer.isCorrect ? "bg-success-subtle text-success-strong" : "bg-surface-100 text-surface-600"}`}
            >
              {answer.isCorrect && <CheckIcon className="size-3.5" />}
              {answer.isCorrect
                ? t("card.answeredCorrect")
                : t("card.answeredIncorrect")}
            </span>
            <LocaleNavLink
              navTarget={target}
              linkKind="plain"
              className={`text-sm ${TEXT_LINK_CLASSES}`}
            >
              {linkLabel(t("card.review"), target, japaneseOnlyLabel)}
            </LocaleNavLink>
          </div>
        )}
      </div>
    </section>
  );
}
