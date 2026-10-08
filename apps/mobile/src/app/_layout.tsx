import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppIntlProvider } from "../lib/intl-provider";
import { useAccountSync } from "../records/use-account-sync";
import { colors } from "../lib/theme";
import { TermSheetProvider } from "../reference/term-sheet";

/**
 * ルートレイアウト
 *
 * @description
 * タブ（ホーム・道場・練習・レッスン・点数表）を土台に、練習の説明・チャレンジ・
 * トレーニング・結果をその上へ積むスタック。チャレンジとトレーニングの画面は
 * web がタブバーを畳むのと同じく、ヘッダーもタブも出さず画面を明け渡す。
 */
export default function RootLayout() {
  useAccountSync();
  return (
    <SafeAreaProvider>
      <AppIntlProvider>
        {/* 本文の用語リンクはどの画面からでも同じシートを開く */}
        <TermSheetProvider>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.card },
              // 見出しは各画面が地の斜線の帯で持つ（web と同じ見た目）
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="practice/[slug]/play"
              options={{ gestureEnabled: false }}
            />
            {/* 結果はヘッダーの × で説明画面へ閉じる。スワイプで戻ると下の画面
                （ディープリンクでは説明画面とは限らない）へ落ち、× と行き先が
                食い違うので切る */}
            <Stack.Screen
              name="practice/[slug]/result"
              options={{ gestureEnabled: false }}
            />
          </Stack>
        </TermSheetProvider>
        <StatusBar style="dark" />
      </AppIntlProvider>
    </SafeAreaProvider>
  );
}
