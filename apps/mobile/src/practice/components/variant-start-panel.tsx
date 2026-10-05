import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";

import { SectionTitle } from "../../components/section-title";
import { colors, radius } from "../../lib/theme";
import { PracticeStartCta } from "./practice-start-cta";

/**
 * 出題設定（バリアント）の選択と開始導線（web の `VariantStartPanel`）
 *
 * レジストリに列挙したバリアントから 1 つ選び、`?variant=` に載せて
 * チャレンジ / トレーニングへ送る。
 */
export function VariantStartPanel({
  slug,
  initialVariant,
}: {
  readonly slug: PracticeMenuSlug;
  readonly initialVariant: string;
}) {
  const { namespace, variants } = practiceMenuBySlug(slug);
  const tVariants = useTranslations(`${namespace}.variants`);
  const tp = useTranslations("practice");
  const [variant, setVariant] = useState(initialVariant);

  return (
    <View style={styles.root}>
      <View style={styles.settings}>
        <SectionTitle>{tp("settingsTitle")}</SectionTitle>
        <View style={styles.options}>
          {variants.map((option) => {
            const isSelected = variant === option;
            return (
              <Pressable
                key={option}
                onPress={() => setVariant(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                <Text
                  style={[styles.label, isSelected && styles.labelSelected]}
                >
                  {tVariants(`${option}.label`)}
                </Text>
                <Text style={styles.hint}>{tVariants(`${option}.hint`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <PracticeStartCta slug={slug} variant={variant} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 24,
  },
  settings: {
    gap: 12,
  },
  options: {
    gap: 8,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.surface200,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    gap: 4,
  },
  optionSelected: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface800,
  },
  labelSelected: {
    color: colors.primary700,
  },
  hint: {
    fontSize: 12,
    color: colors.surface500,
  },
});
