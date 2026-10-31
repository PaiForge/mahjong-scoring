import { Linking, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { BlockingNotice } from "../components/blocking-notice";
import { Button } from "../components/button";
import { STORE_URL } from "./app-version";
import { useUpdateRequired } from "./use-update-required";

/**
 * 最低バージョンを下回る版で、アプリの全面を覆うアップデートの案内
 * アップデート要求オーバーレイ
 *
 * 画面の木（スタック）は下に残したまま上から覆う。差し替えると遷移の
 * 状態が捨てられ、サーバーが最低バージョンを戻したときに元の画面へ
 * 戻れない。閉じる操作は持たない — 使えない版のまま進ませないため。
 */
export function UpdateRequiredOverlay() {
  const required = useUpdateRequired();
  const t = useTranslations("mobileApp.updateRequired");
  if (!required) return null;
  const storeUrl = STORE_URL;
  return (
    <View style={StyleSheet.absoluteFill} testID="update-required">
      <BlockingNotice title={t("title")} description={t("description")}>
        {storeUrl !== undefined && (
          <Button
            onPress={() => void Linking.openURL(storeUrl)}
            fullWidth
            testID="update-open-store"
          >
            {t("openStore")}
          </Button>
        )}
      </BlockingNotice>
    </View>
  );
}
