import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { BottomSheet } from "./bottom-sheet";
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
 * 一覧（{@link SelectOptionList}）を下からのシート（{@link BottomSheet}）で
 * 開く。チップの × で外せる。箱は入力欄なので影を持たない。
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

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={labels.title}
        size="tall"
      >
        <View style={styles.body}>
          <SelectOptionList
            options={options}
            value={value}
            onToggle={handleToggle}
            label={labels.title}
            style={styles.list}
          />
          <Button fullWidth onPress={() => setIsOpen(false)}>
            {labels.done}
          </Button>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: 16,
  },
  list: {
    flex: 1,
  },
});
