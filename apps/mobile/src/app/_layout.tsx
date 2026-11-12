import { TileImageProvider } from "@pai-forge/mahjong-react-ui";
import { resolveBundledTileImage } from "@pai-forge/mahjong-react-ui/bundled-images";
import { Stack } from "expo-router";
import type { NativeStackNavigationOptions } from "expo-router/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { UpdateRequiredOverlay } from "../app-version/update-required-overlay";
import { usePurchaseSync } from "../billing/use-purchase-sync";
import { AppErrorFallback } from "../components/app-error-fallback";
import { ToastHost } from "../components/toast";
import { WindowOverlay } from "../components/window-overlay";
import { AppIntlProvider } from "../lib/intl-provider";
import { useAccountSync } from "../records/use-account-sync";
import { stackScreenOptions } from "../lib/stack-options";
import { TermSheetProvider } from "../reference/term-sheet";

/** 詳細のシート（用語・お知らせ・級の詳細）の出し方 */
const SHEET_OPTIONS: NativeStackNavigationOptions = {
  presentation: "formSheet",
  sheetAllowedDetents: [0.5, 1],
  sheetGrabberVisible: true,
  headerShown: false,
};

/**
 * ルートレイアウト
 *
 * @description
 * タブ（`(tabs)`。ホーム・道場・練習・レッスン・点数表）を土台に、詳細の画面
 * （練習の説明・レッスン・参照・試験の説明等）をその上へ積むネイティブスタック。
 * 見出しと戻るは各画面が `Screen` で OS のヘッダーに載せる（共通の既定は
 * `stackScreenOptions`）。
 *
 * 詳細の画面はタブの中ではなくここに積む（詳細ではタブバーが隠れる）。同じ
 * 詳細へ複数のタブから入るので、タブの中に積むには共有ルートで同じ画面を
 * タブの数だけ持つことになり、URL から居るタブが決まらない。浮くタブバーは
 * タブの入口で得られれば足りる。タブの入口へ戻る決まり（`useGoToTab`・
 * `isTabHref`・`backFallbackHref`）もこの形を前提にしている。
 *
 * モーダルとして出すのは次の 5 つ（`lib/modal-routes.ts` の `MODAL_ROUTE_NAMES`）:
 * - `(session)` — 解答中の画面と結果。全画面のモーダル
 * - `(account)` — マイページ・設定・認証。中にスタックを持つモーダル
 * - 用語・お知らせ・級の詳細 — 半分の高さから出るシート
 *
 * iOS ではモーダルの後に積んだ通常の画面はモーダルの下に入って見えないので、
 * モーダルの中から詳細を開くときは `useOpenFromModal` で先に閉じる。
 * ルートに anchor は置かない（理由は `lib/back-fallback.ts`）。
 *
 * トーストと更新必須の覆いは `WindowOverlay` に描く（iOS のネイティブのモーダルの
 * 上に出すため）。
 */
export default function RootLayout() {
  usePurchaseSync();
  return (
    <SafeAreaProvider>
      <AppIntlProvider>
        <AccountSync />
        {/* 牌はパッケージ同梱の画像（base64）で描く。web と違い静的ファイルを
            配信する手段が無く、アプリのバンドルに画像が入っても起動時に
            一度読むだけなので構わない。Provider が無いと Hai は描けない（例外） */}
        <TileImageProvider resolve={resolveBundledTileImage}>
          {/* 本文の用語リンクはどの画面からでも同じシートを開く */}
          <TermSheetProvider>
            <Stack screenOptions={stackScreenOptions}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* 解答中の画面と結果。下から全画面で出し、閉じるまで他へ行かせない */}
              <Stack.Screen
                name="(session)"
                options={{
                  headerShown: false,
                  presentation: "fullScreenModal",
                }}
              />
              {/* マイページ・設定・認証。中にスタックを持つモーダル */}
              <Stack.Screen
                name="(account)"
                options={{ headerShown: false, presentation: "modal" }}
              />
              {/* 詳細のシート（半分 → 全画面）。見出しはシートの中身が持つ */}
              <Stack.Screen
                name="reference/glossary/[slug]"
                options={SHEET_OPTIONS}
              />
              <Stack.Screen
                name="announcements/[slug]"
                options={SHEET_OPTIONS}
              />
              <Stack.Screen name="dojo/ranks/[slug]" options={SHEET_OPTIONS} />
            </Stack>
          </TermSheetProvider>
        </TileImageProvider>
        {/* ネイティブのモーダルより上に描く（iOS はモーダルがルートの view より上に出る） */}
        <WindowOverlay>
          {/* 遷移をまたいで生き、どの画面の上にも出す（`showToast`） */}
          <ToastHost />
          {/* 使えなくなった版では全面を覆う。トーストより上に置く */}
          <UpdateRequiredOverlay />
        </WindowOverlay>
        <StatusBar style="dark" />
      </AppIntlProvider>
    </SafeAreaProvider>
  );
}

/** 描画に失敗した画面の受け皿。expo-router がこの名前の export を拾う */
export { AppErrorFallback as ErrorBoundary };

/** 預かりの送信を回す（記録できた知らせに辞書を引くので Provider の内側に置く） */
function AccountSync() {
  useAccountSync();
  return null;
}
