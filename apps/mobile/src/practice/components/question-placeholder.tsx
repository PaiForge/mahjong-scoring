import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../../lib/theme";

/** 問題の生成中（web の `QuestionGeneratingPlaceholder`） */
export function QuestionPlaceholder({ label }: { readonly label: string }) {
  return (
    <View style={styles.box}>
      <ActivityIndicator color={colors.action} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: colors.surface400,
  },
});
