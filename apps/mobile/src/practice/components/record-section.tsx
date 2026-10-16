import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import type { ExpInfo } from "@mahjong-scoring/core";
import type { RecordView } from "@mahjong-scoring/features/challenge/record-view";
import {
  formatSignedDelta,
  signedDeltaTone,
} from "@mahjong-scoring/features/challenge/signed-delta";
import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import { myRecordHref } from "@mahjong-scoring/features/routes";

import { Chip } from "../../components/chip";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { HighlightPanel } from "../../lessons/components/highlight-panel";
import { DELTA_TONE_COLORS } from "../../lib/delta-tone-colors";
import { colors } from "../../lib/theme";
import { ExpGain } from "./exp-gain";

/**
 * 記録できたチャレンジの記録の節（web の結果ページの `RecordSection`）
 * 記録セクション
 *
 * web と同じく、見出し「あなたの記録」（右に「自己ベスト更新！」/「初めての記録」の
 * チップ）→ 獲得経験値 → 今回 / 前回 / これまでのベストの 3 行 → マイレコードへの
 * 導線、の固定の形。比べる値が無い行は「—」で残し、前回との差は「今回」の行の値の
 * 隣に置く（差を「前回」の行に置くと前回についての事実に読めるため。web と同じ）。
 *
 * 比較は確定の応答に載った値（サーバーが web と同じ `deriveRecordView` で作る）。
 * 応答に無いとき（サーバーが読めなかった）は 3 行の代わりに断りを出す — 「—」の
 * 並びに倒すと、まだ 1 回も走っていない人の画面と区別がつかない（web と同じ）。
 *
 * 記録が残る回（ログイン中で成績を記録できた回）にだけ置く。ゲストの回は
 * 同じ位置づけの記録の案内（`RecordCtaCard`）が担う。
 */
export function RecordSection({
  exp,
  comparison,
  menuType,
  variant,
}: {
  /** 獲得経験値。経験値の対象外の練習・読めなかったときは undefined */
  readonly exp: ExpInfo | undefined;
  /** 過去の自分の記録との比較。読めなかったときは undefined */
  readonly comparison: RecordView | undefined;
  /** マイレコードを、この土俵を選んだ状態で開くために使う */
  readonly menuType: PracticeMenuType;
  readonly variant: string;
}) {
  const t = useTranslations("challenge.record");
  const router = useRouter();

  const badge =
    comparison?.status === "newBest" ? (
      <Chip tone="success">{t("newBest")}</Chip>
    ) : comparison?.status === "first" ? (
      <Chip tone="neutral">{t("firstRecord")}</Chip>
    ) : undefined;

  const formatScore = (score: number | undefined) =>
    score === undefined ? "—" : t("scoreUnit", { score });

  return (
    <View style={styles.section} testID="record-section">
      <View style={styles.header}>
        <View style={styles.title}>
          <SectionTitle>{t("sectionTitle")}</SectionTitle>
        </View>
        {badge}
      </View>

      {exp !== undefined && <ExpGain exp={exp} />}

      {comparison !== undefined ? (
        <View style={styles.rows}>
          <RecordRow label={t("thisTimeLabel")}>
            <Text style={styles.value}>
              {formatScore(comparison.currentScore)}
            </Text>
            {comparison.diffFromLast !== undefined && (
              <Text
                style={[
                  styles.diff,
                  {
                    color:
                      DELTA_TONE_COLORS[
                        signedDeltaTone(comparison.diffFromLast)
                      ],
                  },
                ]}
              >
                {formatSignedDelta(comparison.diffFromLast)}
              </Text>
            )}
          </RecordRow>
          <RecordRow label={t("lastLabel")}>
            <Text style={styles.value}>
              {formatScore(comparison.previousLastScore)}
            </Text>
          </RecordRow>
          <RecordRow label={t("bestLabel")}>
            <Text style={styles.value}>
              {formatScore(comparison.previousBestScore)}
            </Text>
          </RecordRow>
        </View>
      ) : (
        <HighlightPanel>
          <Text style={styles.failed}>{t("comparisonLoadFailed")}</Text>
        </HighlightPanel>
      )}

      <View style={styles.myRecord}>
        <TextLink
          testID="result-my-record"
          onPress={() => router.push(myRecordHref({ menuType, variant }))}
        >
          {t("viewMyRecords")}
        </TextLink>
      </View>
    </View>
  );
}

/** スコア 1 行分（左に見出し、右に値） */
function RecordRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.values}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 15,
    color: colors.surface600,
  },
  values: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface900,
  },
  diff: {
    fontSize: 13,
    fontWeight: "600",
  },
  failed: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface900,
  },
  myRecord: {
    alignItems: "center",
  },
});
