import { useEffect } from "react";
import { useRouter, type ErrorBoundaryProps } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";

import { AppIntlProvider } from "../lib/intl-provider";
import { BlockingNotice } from "./blocking-notice";
import { Button } from "./button";

/**
 * 描画に失敗したときの画面（ルートレイアウトの `ErrorBoundary`）
 * アプリのエラー画面
 *
 * expo-router はルートレイアウトごとこの画面に置き換えるので、レイアウトが
 * 持つ Provider（セーフエリア・辞書）はここで持ち直す。これが無いと Release
 * では白い画面のまま戻れない（Static Hermes に無い組み込みを呼んだ等）。
 *
 * - 「もう一度試す」— 同じ画面をもう一度描く（読み込みの一時的な失敗向け）
 * - 「ホームに戻る」— 落ちた画面を履歴ごと捨ててホームから描き直す。同じ画面を
 *   描くたびに落ちる失敗でも抜け出せる
 */
export function AppErrorFallback(props: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <AppIntlProvider>
        <AppErrorNotice {...props} />
      </AppIntlProvider>
    </SafeAreaProvider>
  );
}

function AppErrorNotice({ error, retry }: ErrorBoundaryProps) {
  const t = useTranslations("mobileApp.errorBoundary");
  const router = useRouter();

  useEffect(() => {
    console.error("[app] 画面の描画に失敗した", error);
  }, [error]);

  const goHome = () => {
    router.replace("/");
    void retry();
  };

  return (
    <BlockingNotice title={t("title")} description={t("description")}>
      <Button onPress={() => void retry()} fullWidth testID="error-retry">
        {t("retry")}
      </Button>
      <Button
        onPress={goHome}
        variant="neutral"
        fullWidth
        testID="error-go-home"
      >
        {t("home")}
      </Button>
    </BlockingNotice>
  );
}
