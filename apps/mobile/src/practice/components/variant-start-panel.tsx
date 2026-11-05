import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  resolveInitialPracticeVariant,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { VARIANT_PARAM } from "@mahjong-scoring/features/routes";

import {
  usePracticeVariantStore,
  useRememberedPracticeVariant,
} from "../../hooks/use-practice-variant-store";

import { InsetRing } from "../../components/inset-ring";
import { SectionTitle } from "../../components/section-title";
import { borderWidth, colors, radius } from "../../lib/theme";
import { PracticeStartCta } from "./practice-start-cta";

/**
 * 出題設定（バリアント）の選択と開始導線（web の `VariantStartPanel`）
 *
 * レジストリに列挙したバリアントから 1 つ選び、`?variant=` に載せて
 * チャレンジ / トレーニングへ送る。初期選択は `?variant=`、無ければ前回
 * 始めたときの範囲（`resolveInitialPracticeVariant`）。前回の範囲は
 * AsyncStorage から非同期に読むので、読み終えるまでは何も描かない
 * （既定で描いてから切り替えると選択が目の前で動く。読み出しは一瞬で終わる）。
 */
export function VariantStartPanel({
  slug,
}: {
  readonly slug: PracticeMenuSlug;
}) {
  const params = useLocalSearchParams<{ [VARIANT_PARAM]?: string }>();
  const fromUrl = params[VARIANT_PARAM];
  const remembered = useRememberedPracticeVariant(slug);
  if (!remembered.ready) return undefined;
  return (
    <VariantStartForm
      slug={slug}
      initialVariant={resolveInitialPracticeVariant(
        slug,
        typeof fromUrl === "string" ? fromUrl : undefined,
        remembered.variant,
      )}
    />
  );
}

function VariantStartForm({
  slug,
  initialVariant,
}: {
  readonly slug: PracticeMenuSlug;
  readonly initialVariant: string;
}) {
  const { namespace, variants } = practiceMenuBySlug(slug);
  // 例: yakuHanChallenge.variants（完成形のキーで grep したときにここへ着地させるための例）
  const tVariants = useTranslations(`${namespace}.variants`);
  const tp = useTranslations("practice");
  const rememberVariant = usePracticeVariantStore((s) => s.rememberVariant);
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
                style={({ pressed }) => [
                  styles.option,
                  isSelected
                    ? styles.optionSelected
                    : pressed && styles.optionPressed,
                ]}
              >
                {isSelected && (
                  <InsetRing
                    color={colors.selected}
                    borderRadius={radius.panel}
                  />
                )}
                <Text
                  style={[styles.label, isSelected && styles.labelSelected]}
                >
                  {tVariants(`${option}.label`)}
                </Text>
                {/* 例: yakuHanChallenge.variants.all.hint */}
                <Text style={styles.hint}>{tVariants(`${option}.hint`)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <PracticeStartCta
        slug={slug}
        variant={variant}
        // 選択肢を押しただけでは保存せず、始めたときに覚える
        onStart={() => rememberVariant(slug, variant)}
      />
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
  // 選択肢のタイルはフォーム部品と同じ一段濃い灰の枠。選択中は枠の内側に
  // 線を足して、塗りだけに頼らない
  option: {
    borderWidth: borderWidth.panel,
    borderColor: colors.surface300,
    backgroundColor: colors.white,
    borderRadius: radius.panel,
    padding: 16,
    gap: 4,
  },
  optionSelected: {
    borderColor: colors.selected,
    backgroundColor: colors.selectedSubtle,
  },
  optionPressed: {
    borderColor: colors.surface400,
    backgroundColor: colors.surface50,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface800,
  },
  labelSelected: {
    color: colors.foreground,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.surface500,
  },
});
