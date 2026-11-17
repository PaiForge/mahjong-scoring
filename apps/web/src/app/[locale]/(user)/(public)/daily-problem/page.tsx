/**
 * 本日の問題
 *
 * @description 全員に同じ和了形の点数計算 1 問を、1 日（JST）1 問出すページ。
 * チャレンジでもトレーニングでもなく、記録は「解いた」ことと正誤だけ。問題は
 * サーバーがその日の最初の閲覧で選んで固定し（`getDailyProblem`）、盤面
 * （`AgariProblemPayload`）と日付だけをクライアントの盤面へ渡す。問題
 * （`ScoreQuestion`）は閲覧者のルール設定で盤面が組み立てる — ルール設定は
 * 端末ローカルでサーバーは知らないため。回数制限を通さず、練習の問題の保存にも
 * 送らない（盤面の TSDoc）。
 *
 * @design 出題ページは誰でも解ける。記録はログイン済みだけ
 * 未ログインでも解いて答え合わせまでできる（記録の Action は何もしない）。
 * ホームのカードとアプリの画面はログイン済みだけに出す — ホームはログイン済みの
 * 画面で、アプリのゲストに出すには端末側の解答済みの保存が要り、初版の範囲を
 * 超えるため。解答中のルート（`isSessionRoute`）には含めない — お試しの
 * `/try/agari-score` と同じく、ナビゲーションを残したまま 1 問を解く画面。
 *
 * cookie を読む（ログイン中なら今日の解答を読む）動的ページ。日付で中身が変わる
 * ので両言語とも索引させない（公開状態 `published-noindex`、sitemap に載せない）。
 * 停止中（`DAILY_PROBLEM_DISABLED`）・候補が無い日は「準備中」と練習一覧への
 * リンクを出す。問題の読み取り（DB）の失敗はエラー境界に任せる。今日の解答の
 * 読み取りの失敗は「解答済み」の注記を省くだけにする（解くことには要らない）。
 *
 * @flow ホームのカード「解く」/「もう一度見る」→ 問題を見る → 翻・符・点数を回答
 * （または「わからない」で正解を開示）→ 答え合わせ → 「もっと解く」の和了形の
 * 点数計算（/practice/agari-score）か、ホームへ戻る
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { PRACTICE_SCROLL_ANCHOR_ID } from "@/app/[locale]/(user)/(public)/practice/_lib/scroll-anchor";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { prepareRouteLocale } from "@/i18n/route-locale";
import { getOptionalUser } from "@/lib/auth";
import { readDailyProblemAnswer } from "@/lib/daily-problem/answers";
import { getDailyProblem } from "@/lib/daily-problem/today";
import { logExternalError } from "@/lib/log-error";
import type { DailyProblemAnswerState } from "@mahjong-scoring/features/daily-problem/mobile-api";
import {
  AGARI_SCORE_PRACTICE_HREF,
  PRACTICE_PATH,
} from "@mahjong-scoring/features/routes";

import { DailyProblemBoard } from "./_components/daily-problem-board";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/daily-problem">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/daily-problem");
  return {
    ...(await createNamespaceMetadata("dailyProblem", {
      title: "meta.title",
      description: "meta.description",
      locale,
    })),
    // 日付で中身が変わるので両言語とも索引させない
    robots: { index: false, follow: true },
  };
}

/**
 * 今日の解答を読む。読めなければ未解答として扱う（「解答済み」の注記を省くだけ）
 */
async function readTodayAnswer(
  userId: string,
  day: string,
): Promise<DailyProblemAnswerState | undefined> {
  try {
    return await readDailyProblemAnswer(userId, day);
  } catch (error: unknown) {
    logExternalError(
      "DailyProblemPage",
      "本日の問題の解答を読めなかった",
      error,
    );
    return undefined;
  }
}

export default async function DailyProblemPage({
  params,
}: PageProps<"/[locale]/daily-problem">) {
  const locale = await prepareRouteLocale(params, "/daily-problem");
  const [t, tNav, user, problem] = await Promise.all([
    getTranslations("dailyProblem"),
    getTranslations("nav"),
    getOptionalUser(),
    getDailyProblem(new Date()),
  ]);

  if (problem === undefined) {
    const practiceList = resolveNavTargetFor(PRACTICE_PATH, locale);
    return (
      <ContentContainer breadcrumb={[{ label: t("title") }]}>
        <PageTitle>{t("title")}</PageTitle>
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-surface-500">
            {t("board.unavailable")}
          </p>
          <p>
            <LocaleNavLink
              navTarget={practiceList}
              linkKind="plain"
              className={`text-sm ${TEXT_LINK_CLASSES}`}
            >
              {t("board.toPractice")}
              {practiceList.crossLocale && (
                <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
              )}
            </LocaleNavLink>
          </p>
        </div>
      </ContentContainer>
    );
  }

  const initialAnswer = user
    ? await readTodayAnswer(user.id, problem.day)
    : undefined;

  return (
    // 練習の play 画面・体験ページと同じく、スクロール先をカード領域（盤面）に置く
    <ContentContainer
      id={PRACTICE_SCROLL_ANCHOR_ID}
      fillViewport
      breadcrumb={[{ label: t("title") }]}
    >
      <PageTitle>{t("title")}</PageTitle>
      <DailyProblemBoard
        payload={problem.payload}
        day={problem.day}
        initialAnswer={initialAnswer}
        practiceTarget={resolveNavTargetFor(AGARI_SCORE_PRACTICE_HREF, locale)}
        homeTarget={resolveNavTargetFor("/", locale)}
      />
    </ContentContainer>
  );
}
