import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { borderWidth, colors, radius } from "../lib/theme";

interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  /** 欄の下に添える補足（入力の規則など） */
  readonly hint?: string;
  /** パスワードとして伏せる */
  readonly secure?: boolean;
  readonly maxLength?: number;
  /** 何を入れる欄かを OS に伝える（自動入力・キーボードの種類） */
  readonly kind?: "email" | "password" | "newPassword" | "username" | "text";
  readonly editable?: boolean;
  readonly onSubmitEditing?: () => void;
  /** UI テスト（Maestro）が欄を引く印。文字（ラベル・プレースホルダ）は辞書で変わるので使わない */
  readonly testID?: string;
}

/** 欄の種類ごとの OS への伝え方（パスワードの自動入力・メールのキーボード） */
const KIND_PROPS: Record<
  NonNullable<TextFieldProps["kind"]>,
  Partial<TextInputProps>
> = {
  email: {
    keyboardType: "email-address",
    autoComplete: "email",
    textContentType: "emailAddress",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  password: {
    autoComplete: "current-password",
    textContentType: "password",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  newPassword: {
    autoComplete: "new-password",
    textContentType: "newPassword",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  username: {
    autoComplete: "username-new",
    textContentType: "username",
    autoCapitalize: "none",
    autoCorrect: false,
  },
  text: {},
};

/**
 * ラベル付きの 1 行の入力欄（web の `AuthTextField`）
 * テキスト入力欄
 *
 * 押して始める面ではないので、太枠ではなく細い枠（`panelFrame` と同じ
 * 1px）で組み、入力中だけ枠を緑にする。文字は 16pt — iOS の web 版で
 * それ未満だと、入力を始めたときに画面が拡大される。
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  secure = false,
  maxLength,
  kind = "text",
  editable = true,
  onSubmitEditing,
  testID,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.surface400}
        secureTextEntry={secure}
        maxLength={maxLength}
        editable={editable}
        onSubmitEditing={onSubmitEditing}
        testID={testID}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        style={[styles.input, focused && styles.inputFocused]}
        {...KIND_PROPS[kind]}
      />
      {hint !== undefined && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface700,
  },
  input: {
    borderWidth: borderWidth.panel,
    borderColor: colors.surface400,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: colors.surface700,
  },
  inputFocused: {
    borderColor: colors.primary500,
  },
  hint: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
});
