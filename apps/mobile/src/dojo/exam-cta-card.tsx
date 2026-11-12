import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  rankRequiringMenu,
  rankTier,
} from "@mahjong-scoring/features/ranks/registry";
import { practiceHref } from "@mahjong-scoring/features/routes";

import { SectionTitle } from "../components/section-title";
import { useOpenFromModal } from "../hooks/use-open-from-modal";
import { colors } from "../lib/theme";
import { BeltButton } from "./belt-button";
import { beltCardFrame } from "./belt-style";

/**
 * 昇級試験への案内（web の `ExamCtaCard`）
 * 昇級試験導線
 *
 * 試験（練習）からランクを逆引きし、試験名・リード文・合格基準と、試験の
 * 説明画面への帯色のボタンを置く。合格条件（制限時間・ミス上限）は遷移先の
 * 説明画面だけが持つ。どのランクにも紐付かない練習なら何も描かない。
 *
 * 説明画面は `useOpenFromModal` で開く。級の詳細のシートの中から開くと、
 * シートを閉じてから積む（iOS ではシートの後に積んだ通常の画面はシートの下に
 * 入って見えない）。モーダルの外（レッスンの末尾）ではただの `push`。
 */
export function ExamCtaCard({
  slug,
  lead,
}: {
  /** 昇級試験の練習スラッグ */
  readonly slug: PracticeMenuSlug;
  /** リード文（翻訳済み）。省略すると既定の文（レッスンの末尾から出すとき） */
  readonly lead?: string;
}) {
  const t = useTranslations("ranks");
  const openFromModal = useOpenFromModal();
  const exam = rankRequiringMenu(practiceMenuBySlug(slug).menuType);
  if (!exam) return undefined;
  const rankSlug = exam.rank.slug;

  return (
    <View style={styles.section}>
      <SectionTitle>
        {t(`examTitle.${rankTier(rankSlug)}`, {
          rank: t(`names.${rankSlug}`),
        })}
      </SectionTitle>
      {/* どの級の試験かを上端の帯の色でも示す（web と同じく細い枠 + 上端の帯）。
          既定の緑は使わない — 級名を掲げたカードが緑だと、緑がその級の色に見える */}
      <View style={[styles.card, beltCardFrame(rankSlug)]}>
        <Text style={styles.lead}>{lead ?? t("examCta.lead")}</Text>
        <Text style={styles.criterion}>
          <Text style={styles.criterionLabel}>
            {t("examCta.criterionLabel")}:{" "}
          </Text>
          {t(`criteria.${rankSlug}`)}
        </Text>
        <BeltButton
          slug={rankSlug}
          onPress={() => openFromModal(practiceHref(slug))}
        >
          {t("examCta.viewExam")}
        </BeltButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  card: {
    padding: 20,
    gap: 16,
  },
  lead: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface700,
  },
  criterion: {
    fontSize: 14,
    color: colors.surface700,
  },
  criterionLabel: {
    fontWeight: "700",
  },
});
