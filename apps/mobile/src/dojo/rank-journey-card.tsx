import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import type { RankJourney } from "@mahjong-scoring/features/journey/journey";
import { practiceDisplayTitle } from "@mahjong-scoring/features/practice/practice-variant-label";
import { chapterHref, practiceHref } from "@mahjong-scoring/features/routes";

import { Divider } from "../components/divider";
import { LockClosedIcon } from "../components/icons/icons";
import { LinkRow, LinkRowList } from "../components/link-row";
import { colors } from "../lib/theme";
import { BeltButton } from "./belt-button";
import { beltCardFrame } from "./belt-style";
import { DoneMark } from "./done-mark";
import { RankHeading } from "./rank-heading";
import { RankStageProgress } from "./rank-stage-progress";

/**
 * 黒帯への道の 1 級分（web の `RankJourneyCard`）
 * 級の行程カード
 *
 * 級の見出し（帯バッジ・級名と合格基準・取得状態）と「学ぶ / 練習する /
 * 試験」の進み具合を 1 枚に載せる。開いたカード（道場の「次の目標」の節）は
 * 中身を開き、学ぶ段（レッスンの行）・レッスンから送る練習の行・試験への
 * 帯色のボタンを並べる。黒帯への道に並べるカードは次の目標の級も含めて
 * 閉じたまま、級名から詳細画面へ送る（中身を 2 回出さない）。
 *
 * 未取得の上位級には「下の級から順に取得すると受験できます」を添える。
 * モバイルは本番の試験を開かない（模試だけ）が、段級位の順序の規則として
 * web と同じ文言を出す。
 *
 * 枠は細枠で、上端に帯色の帯を敷く。練習するの行の挑戦済みの印は、端末に記録した「チャレンジを
 * 終えた」練習から出す（成績は記録しない）。
 */
export function RankJourneyCard({
  journey,
  expanded,
}: {
  readonly journey: RankJourney;
  /** 中身（学ぶ・練習する・認定される）を開くか。道場の「次の目標」の節だけが開く */
  readonly expanded: boolean;
}) {
  const t = useTranslations("dojo");
  const tRanks = useTranslations("ranks");
  const tAll = useTranslations();
  const router = useRouter();
  const { rank, status, chapters, practices, exam } = journey;

  return (
    <View style={[styles.card, beltCardFrame(rank.slug)]}>
      <RankHeading rankSlug={rank.slug} status={status} />

      <View style={styles.progress}>
        <RankStageProgress journey={journey} isCurrentRank={expanded} />
      </View>

      {status === "unachieved" && (
        <View style={styles.lockedRow}>
          <LockClosedIcon size={14} color={colors.surface500} />
          <Text style={styles.lockedNote}>{t("lockedNote")}</Text>
        </View>
      )}

      {expanded && (
        <View style={styles.expanded}>
          <Divider />

          {chapters.length > 0 && (
            <View style={styles.stage}>
              <Text accessibilityRole="header" style={styles.stageTitle}>
                {tRanks("stages.learn")}
              </Text>
              {/* 学ぶ段はレッスンごとに 1 行。題名と説明は章の辞書から引く */}
              <LinkRowList inset>
                {chapters.map((item) => {
                  const chapter = getChapterBySlug(item.chapterSlug);
                  const path = chapter
                    ? `learnCurriculum.${getChapterI18nPath(chapter)}`
                    : undefined;
                  return (
                    <LinkRow
                      key={item.chapterSlug}
                      onPress={() => router.push(chapterHref(item.chapterSlug))}
                      title={path ? tAll(`${path}.title`) : item.chapterSlug}
                      description={
                        path ? tAll(`${path}.description`) : undefined
                      }
                      trailing={
                        item.done ? (
                          <DoneMark label={t("lessonDone")} />
                        ) : undefined
                      }
                    />
                  );
                })}
              </LinkRowList>
            </View>
          )}

          {practices.length > 0 && (
            <View style={styles.stage}>
              <Text accessibilityRole="header" style={styles.stageTitle}>
                {tRanks("stages.practice")}
              </Text>
              <LinkRowList inset>
                {practices.map((item) => {
                  const title = practiceDisplayTitle(
                    tAll,
                    item.slug,
                    item.variant,
                  );
                  return (
                    <LinkRow
                      key={`${item.slug}:${item.variant ?? ""}`}
                      onPress={() =>
                        router.push(practiceHref(item.slug, item.variant))
                      }
                      title={title}
                      trailing={
                        item.done ? (
                          <DoneMark label={t("practiceDone")} />
                        ) : undefined
                      }
                    />
                  );
                })}
              </LinkRowList>
            </View>
          )}

          <View style={styles.stage}>
            <Text accessibilityRole="header" style={styles.stageTitle}>
              {tRanks("stages.exam")}
            </Text>
            <BeltButton
              slug={rank.slug}
              onPress={() => router.push(practiceHref(exam.slug))}
            >
              {t("viewExam")}
            </BeltButton>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  progress: {
    marginTop: 12,
  },
  lockedRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lockedNote: {
    fontSize: 12,
    color: colors.surface500,
  },
  expanded: {
    marginTop: 20,
    gap: 24,
  },
  stage: {
    gap: 12,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface900,
  },
});
