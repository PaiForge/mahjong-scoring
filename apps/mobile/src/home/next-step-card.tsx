import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { Journey } from "@mahjong-scoring/features/journey/journey";
import {
  journeyStepHref,
  journeyStepTitle,
} from "@mahjong-scoring/features/journey/journey-step";
import { listedPracticeRanks } from "@mahjong-scoring/features/practice/rank-practices";

import { SectionTitle } from "../components/section-title";
import { TextLink } from "../components/text-link";
import { BeltButton } from "../dojo/belt-button";
import { beltCardFrame } from "../dojo/belt-style";
import { practiceListHrefForRank } from "../dojo/dojo-routes";
import { RankHeading } from "../dojo/rank-heading";
import { RankStageProgress } from "../dojo/rank-stage-progress";

/**
 * ホームの「次にやること」（web の `NextStepSection`）
 * 次にやること
 *
 * 黒帯への道（`buildJourney`）が決めた今やること 1 つを、次に取る級の帯色で
 * 縁取ったカードに出す。級の見出し → 進み具合（学ぶ・練習する・試験）→
 * 対象の名前を含むボタン → 「自分で練習を選ぶ」の順で、文言と行き先は web と
 * 同じもの（features の `journey-step`、辞書の `dashboard.nextStep`）。
 *
 * 枠は道場の級カードと同じ細枠 + 上端の帯色の帯（web と同じ）。
 *
 * 全級取得済み（`nextStep` が無い）なら何も描画しない。モバイルは段級位を
 * 持たないので実際には常に描画される。
 */
export function NextStepCard({ journey }: { readonly journey: Journey }) {
  const t = useTranslations("dashboard.nextStep");
  const tAll = useTranslations();
  const router = useRouter();
  const { current, nextStep, isFresh } = journey;
  if (current === undefined || nextStep === undefined) return undefined;

  const rankSlug = current.rank.slug;
  const title = journeyStepTitle(nextStep, tAll);
  const ctaKey =
    nextStep.kind === "lesson" && isFresh
      ? "lesson.firstCta"
      : `${nextStep.kind}.cta`;

  return (
    <View style={styles.section}>
      <SectionTitle>{t("title")}</SectionTitle>
      <View style={[styles.card, beltCardFrame(rankSlug)]}>
        <RankHeading rankSlug={rankSlug} status={current.status} />
        <RankStageProgress journey={current} isCurrentRank />
        <View style={styles.actions}>
          <BeltButton
            slug={rankSlug}
            onPress={() => router.push(journeyStepHref(nextStep))}
          >
            {t(`steps.${ctaKey}`, { title })}
          </BeltButton>
          {/* 目標の級で絞った練習一覧へ。一覧に並ぶ練習を持たない級だけ絞らない（web と同じ） */}
          <TextLink
            onPress={() =>
              router.push(
                listedPracticeRanks().includes(rankSlug)
                  ? practiceListHrefForRank(rankSlug)
                  : "/practice",
              )
            }
          >
            {t("choosePractice")}
          </TextLink>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  card: {
    gap: 16,
    padding: 16,
  },
  actions: {
    gap: 16,
    alignItems: "center",
  },
});
