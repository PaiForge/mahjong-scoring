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

/** 出題設定の選択の状態（{@link useVariantSelection}） */
export type VariantSelection =
  | { readonly ready: false }
  | {
      readonly ready: true;
      /** 今選んでいるバリアント */
      readonly variant: string;
      readonly select: (variant: string) => void;
      /** 今の選択を「前回始めた範囲」として覚える（始めるときに呼ぶ） */
      readonly remember: () => void;
    };

/**
 * 出題設定（バリアント）の選択を持つ
 * 出題設定の選択
 *
 * レジストリに列挙したバリアントから 1 つ選び、`?variant=` に載せて
 * チャレンジ / トレーニングへ送る。初期選択は `?variant=`、無ければ前回
 * 始めたときの範囲（`resolveInitialPracticeVariant`）。前回の範囲は
 * AsyncStorage から非同期に読むので、読み終えるまでは `ready: false`
 * （既定で描いてから切り替えると選択が目の前で動く。読み出しは一瞬で終わる）。
 *
 * 選択肢（{@link VariantOptions}。本文）と開始のボタン（下端の帯）が別の場所に
 * 描かれるので、状態は説明画面が持ち、両方へ渡す。選択肢を押しただけでは
 * 保存せず、始めたときに覚える（`remember`）。
 */
export function useVariantSelection(slug: PracticeMenuSlug): VariantSelection {
  const params = useLocalSearchParams<{ [VARIANT_PARAM]?: string }>();
  const fromUrl = params[VARIANT_PARAM];
  const remembered = useRememberedPracticeVariant(slug);
  const rememberVariant = usePracticeVariantStore((s) => s.rememberVariant);
  const [selected, setSelected] = useState<string>();
  if (!remembered.ready) return { ready: false };
  const variant =
    selected ??
    resolveInitialPracticeVariant(
      slug,
      typeof fromUrl === "string" ? fromUrl : undefined,
      remembered.variant,
    );
  return {
    ready: true,
    variant,
    select: setSelected,
    remember: () => rememberVariant(slug, variant),
  };
}

/**
 * 出題設定（バリアント）の選択肢（web の `VariantStartPanel` の上半分）
 */
export function VariantOptions({
  slug,
  variant,
  onSelect,
}: {
  readonly slug: PracticeMenuSlug;
  readonly variant: string;
  readonly onSelect: (variant: string) => void;
}) {
  const { namespace, variants } = practiceMenuBySlug(slug);
  // 例: yakuHanChallenge.variants（完成形のキーで grep したときにここへ着地させるための例）
  const tVariants = useTranslations(`${namespace}.variants`);
  const tp = useTranslations("practice");

  return (
    <View style={styles.settings}>
      <SectionTitle>{tp("settingsTitle")}</SectionTitle>
      <View style={styles.options}>
        {variants.map((option) => {
          const isSelected = variant === option;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
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
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {tVariants(`${option}.label`)}
              </Text>
              {/* 例: yakuHanChallenge.variants.all.hint */}
              <Text style={styles.hint}>{tVariants(`${option}.hint`)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
