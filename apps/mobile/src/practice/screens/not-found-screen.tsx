import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";

/** 練習が見つからない（未知の slug・モバイル未移植） */
export function PracticeNotFoundScreen() {
  const t = useTranslations("challenge");
  const tn = useTranslations("notFound");
  const router = useRouter();
  return (
    <Screen title={tn("title")} back>
      <Text style={styles.text}>{tn("description")}</Text>
      <TextLink onPress={() => router.replace("/practice")}>
        {t("backToList")}
      </TextLink>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: colors.surface500,
    textAlign: "center",
  },
});
