import { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius } from "../lib/theme";
import { ChevronDownIcon } from "./icons/icons";

/** 選択肢 1 つ（値と表示名） */
export interface SelectOption<TValue extends string | number> {
  readonly value: TValue;
  readonly label: string;
}

interface SelectFieldProps<TValue extends string | number> {
  readonly options: readonly SelectOption<TValue>[];
  /** 選択中の値（未選択は undefined） */
  readonly value: TValue | undefined;
  readonly onChange: (value: TValue) => void;
  /** 未選択時に欄へ出す文言。一覧の見出しにも使う */
  readonly placeholder: string;
  /** 読み上げ用の名前（可視ラベルを持てない欄。省略時は placeholder） */
  readonly accessibilityLabel?: string;
  readonly disabled?: boolean;
  /**
   * 欄の枠と地の上書き（回答直後の正誤の配色など）
   *
   * 指定中は無効時のグレーの地を付けない（付けたままだと上書きした地を
   * 塗り潰す。web の `getSelectClass` と同じ扱い）。
   */
  readonly frameStyle?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/**
 * 選択欄（web の `<select>` の代わり）
 * セレクト欄
 *
 * 押すと下からせり上がる一覧を開き、1 つ選ぶと閉じて `onChange` を呼ぶ。
 * React Native には `<select>` が無く、OS ごとのピッカーは見た目も操作も
 * 揃わないため、アプリの部品で組む。欄の見た目は web の select と同じ
 * 太枠（3px・ink）の白地で、押せる面の記号である影は持たない（入力欄のため）。
 */
export function SelectField<TValue extends string | number>({
  options,
  value,
  onChange,
  placeholder,
  accessibilityLabel,
  disabled = false,
  frameStyle,
  testID,
}: SelectFieldProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value);

  const close = useCallback(() => setIsOpen(false), []);
  const handleSelect = useCallback(
    (next: TValue) => {
      setIsOpen(false);
      // `<select>` と同じく、選び直さなかったときは変更として届けない
      if (next !== value) onChange(next);
    },
    [onChange, value],
  );

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        disabled={disabled}
        accessibilityRole="combobox"
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityValue={{ text: selected?.label }}
        accessibilityState={{ disabled, expanded: isOpen }}
        testID={testID}
        style={[
          styles.field,
          disabled && frameStyle === undefined && styles.fieldDisabled,
          frameStyle,
        ]}
      >
        <Text
          style={[styles.value, selected === undefined && styles.placeholder]}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDownIcon size={16} color={colors.surface500} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={placeholder}
          />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Text style={styles.sheetTitle}>
              {accessibilityLabel ?? placeholder}
            </Text>
            <ScrollView style={styles.list}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSelected }}
                    testID={
                      testID === undefined
                        ? undefined
                        : `${testID}-option-${option.value}`
                    }
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.optionSelected,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  fieldDisabled: {
    backgroundColor: colors.surface100,
  },
  value: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.surface900,
  },
  placeholder: {
    color: colors.surface400,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: colors.card,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: colors.ink,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
    textAlign: "center",
  },
  list: {
    flexGrow: 0,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  optionSelected: {
    backgroundColor: colors.primary100,
  },
  optionPressed: {
    backgroundColor: colors.surface100,
  },
  optionText: {
    fontSize: 16,
    color: colors.surface900,
    textAlign: "center",
  },
  optionTextSelected: {
    fontWeight: "700",
    color: colors.primary700,
  },
});
