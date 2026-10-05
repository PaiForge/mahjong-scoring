import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";
import { Button } from "./button";
import { SelectOptionList, type SelectOption } from "./select-option-list";
import { SelectValueBox } from "./select-value-box";

/** 選択欄の文言（開く入口の名前・一覧の見出し・閉じるボタン） */
export interface MultiSelectLabels {
  readonly add: string;
  readonly title: string;
  readonly done: string;
}

interface MultiSelectProps {
  readonly options: readonly SelectOption[];
  /** 選択済みの値 */
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  /** 何も選ばれていないときに箱へ出す文言 */
  readonly placeholder: string;
  readonly disabled?: boolean;
  readonly labels: MultiSelectLabels;
}

/**
 * 複数選択の選択欄（web の `MultiSelect`）
 * マルチセレクト
 *
 * 選んだ値をチップで並べた箱（{@link SelectValueBox}）を押すと、選択肢の
 * 一覧（{@link SelectOptionList}）をモーダルで開く。チップの × で外せる。
 * 箱は入力欄なので影を持たない。一覧のパネルも押せる面ではないので影を
 * 持たず、太枠で区切る（web の `ModalShell` と同じ）。
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  labels,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleRemove = (removed: string) => {
    onChange(value.filter((v) => v !== removed));
  };

  const handleToggle = (toggled: string) => {
    if (value.includes(toggled)) {
      handleRemove(toggled);
    } else {
      onChange([...value, toggled]);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={labels.add}
        accessibilityState={{ disabled, expanded: isOpen }}
      >
        <SelectValueBox
          options={options}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onRemove={handleRemove}
        />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={labels.done}
          />
          <View style={styles.panel}>
            <Text style={styles.title}>{labels.title}</Text>
            <SelectOptionList
              options={options}
              value={value}
              onToggle={handleToggle}
              label={labels.title}
              style={styles.list}
            />
            <View style={styles.actions}>
              <Button onPress={() => setIsOpen(false)}>{labels.done}</Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  panel: {
    width: "100%",
    maxWidth: 440,
    height: "70%",
    backgroundColor: colors.card,
    borderWidth: 4,
    borderColor: colors.ink,
    borderRadius: radius["2xl"],
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface900,
  },
  list: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
