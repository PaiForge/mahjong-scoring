import type { ReactNode } from "react";
import { ExamStartCta } from "@/app/(user)/(public)/exam/_components/exam-start-cta";
import { HowToPlaySection } from "./how-to-play-section";
import { LeaderboardPreviewLoader } from "./leaderboard-preview-loader";
import { PracticeRelatedChapters } from "./practice-related-chapters";
import { PracticeStartCta } from "./practice-start-cta";
import { VariantStartPanel } from "./variant-start-panel";
import { buildPracticeStartCtaLabels } from "@mahjong-scoring/features/practice/start-cta-labels";
import { getTranslations } from "next-intl/server";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import { getNativeAdCreative } from "@/lib/ads/creatives";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { practiceMenuBySlug } from "@mahjong-scoring/features/practice-menu-types";
import { isExamMenu } from "@mahjong-scoring/features/practice/catalog";
import { practiceListHref } from "../_lib/practice-web-routes";
import {
  DOJO_PATH,
  PRACTICE_PATH,
  practicePlayHref,
  practiceTrainingHref,
} from "@mahjong-scoring/features/routes";
import { PRACTICE_SCROLL_HASH } from "../_lib/scroll-anchor";

interface PracticeIntroContentProps {
  /** i18n ネームスペース（例: "jantouFu"） */
  readonly namespace: string;
  /** 練習スラッグ（例: "jantou-fu"） */
  readonly slug: PracticeMenuSlug;
  /**
   * トレーニングモードへのボタンを表示するかどうか（デフォルト: false）。
   * 昇級試験は常に模試（トレーニング）の導線を持つため、この旗を見ない。
   * 出題設定を持つ練習（レジストリの `variants`）も見ない —
   * {@link VariantStartPanel} が設定と一緒に両方の導線を出す。
   */
  readonly showTraining?: boolean;
  /**
   * 問題方式（遊び方）のビジュアルデモ。渡された場合は説明文の代わりに
   * 「問題方式」セクションとして実際の出題例を表示する。
   */
  readonly howToPlay?: ReactNode;
  /**
   * 開始ボタンの直前に置く注意書き（昇級試験の合格条件パネル等）。
   * 開始前に必ず目に入る位置に出したい情報のためのスロット。
   */
  readonly notice?: ReactNode;
}

/**
 * 練習説明ページの共通コンテンツ
 * 練習説明共通
 *
 * @remarks
 * レッスンのセクションは {@link PracticeRelatedChapters} が練習と昇級試験の
 * どちらかで見出しと章の集合を決める（結果ページと共有する）。練習ページ側で
 * パスを渡したり表示可否を切り替えたりはしない。
 */
export async function PracticeIntroContent({
  namespace,
  slug,
  showTraining = false,
  howToPlay,
  notice,
}: PracticeIntroContentProps) {
  const t = await getTranslations(namespace);
  const tc = await getTranslations("challenge");
  const tp = await getTranslations("practice");
  const tt = await getTranslations("training");
  const tDojo = await getTranslations("dojo");
  const tRanks = await getTranslations("ranks");
  const isExam = isExamMenu(slug);
  // 昇級試験は練習一覧のカードにならず道場から入るため、親も道場にする
  const parent = isExam
    ? { label: tDojo("title"), href: DOJO_PATH }
    : { label: tp("title"), href: PRACTICE_PATH };

  // 段級位への導線（ページ末尾）に使う
  const examRank = isExam
    ? rankRequiringMenu(practiceMenuBySlug(slug).menuType)?.rank
    : undefined;
  // 広告は開始の導線とレッスンの後ろに置く（始める前に目に入れない）
  const ad = await getNativeAdCreative(
    isExam ? "exam-intro-native-ad" : "practice-intro-native-ad",
  );

  return (
    <ContentContainer breadcrumb={[parent, { label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>
      {/* カード内のセクション間マージンは space-y で等間隔に統一する */}
      <div className="space-y-8">
        {/* 説明文は問題方式デモが冗長になるため、デモ未指定時のみ表示 */}
        {!howToPlay && (
          <p className="text-sm text-surface-500">{t("description")}</p>
        )}

        {howToPlay && (
          <HowToPlaySection
            title={t("howToPlay.title")}
            lead={t("howToPlay.lead")}
          >
            {howToPlay}
          </HowToPlaySection>
        )}

        {notice}

        {isExam ? (
          /* 昇級試験は本番 / 模試の 2 本。本番は受験資格（次に取る級か、
             達成済みの級の再挑戦）でボタンを出し分ける。ゲートはクライアント
             側の表示制御で、静的配信を保ったまま未ログイン・資格なしの案内を
             出す。模試は誰でも受けられる */
          <ExamStartCta
            slug={slug}
            playHref={`${practicePlayHref(slug)}${PRACTICE_SCROLL_HASH}`}
            trainingHref={`${practiceTrainingHref(slug)}${PRACTICE_SCROLL_HASH}`}
          />
        ) : practiceMenuBySlug(slug).hasSetup ? (
          /* 出題設定（バリアント）を持つ練習は、選択パネルが開始導線まで
             持つ。設定を選ばせてから play / training へ `?variant=` を
             載せて送るため、開始ボタンだけを先に出すことができない */
          <VariantStartPanel slug={slug} />
        ) : showTraining ? (
          <PracticeStartCta
            playHref={`${practicePlayHref(slug)}${PRACTICE_SCROLL_HASH}`}
            trainingHref={`${practiceTrainingHref(slug)}${PRACTICE_SCROLL_HASH}`}
            labels={buildPracticeStartCtaLabels(
              { challenge: tc, practice: tp, training: tt },
              practiceMenuBySlug(slug),
            )}
          />
        ) : (
          <LinkButton
            href={`${practicePlayHref(slug)}${PRACTICE_SCROLL_HASH}`}
            size="lg"
            fullWidth
          >
            <PlayIcon className="size-4" />
            {tc("startButton")}
          </LinkButton>
        )}

        <PracticeRelatedChapters slug={slug} />

        {/* 目次は枠を持たないので、広告の行も枠を描かない（/lessons と同じ） */}
        {!isExam && ad && (
          <LinkRowList inset>
            <NativeAdRow creative={ad} />
          </LinkRowList>
        )}

        {/* 前提章の下に「その級の練習」への行リンクを置く。試験に落ちた人が
            次に行く先は教本の読み直しだけではなく、同じ範囲を数える練習でも
            ある。ダッシュボードが試験へ送るのと同じ行リンクで、押しても
            試験は始まらないことを見た目の重みでも揃える。 */}
        {examRank && (
          <LinkRowList>
            <LinkRow
              href={practiceListHref({ kind: "rank", value: examRank.slug })}
              leading={
                <span className="text-base" aria-hidden="true">
                  ✏️
                </span>
              }
              title={tRanks("practiceLink.title", {
                rank: tRanks(`names.${examRank.slug}`),
              })}
              description={tRanks("practiceLink.description")}
            />
            {/* 試験は目次の下ではなく、この行リンクの並びの末尾に置く */}
            {ad && <NativeAdRow creative={ad} />}
          </LinkRowList>
        )}

        {/* ランキングはタブバーに置かず、練習の入口で上位を見せて導線にする。
            昇級試験は記録を残さないため出さない */}
        {!isExam && <LeaderboardPreviewLoader slug={slug} />}
      </div>
    </ContentContainer>
  );
}
