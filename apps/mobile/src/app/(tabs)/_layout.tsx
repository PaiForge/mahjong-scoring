import { NativeTabs } from "expo-router/native-tabs";
import { useTranslations } from "use-intl";

import { colors } from "../../lib/theme";

/** タブの文字（OS のタブバーに渡せるのは大きさ・太さ・色だけ） */
const LABEL_STYLE = { fontSize: 11, fontWeight: "600" } as const;

/**
 * 下部タブ
 *
 * web のモバイル下部タブバー（`TAB_BAR_NAV_ITEMS`）と同じ並び: ホーム・道場・
 * 練習・レッスン・点数表。起動時は先頭のホームを開く。web がドロワーと
 * アカウントのメニューに置く設定は、どちらも持たないモバイルではマイページ
 * （ホームのヘッダー右のアバター）の奥に置く（タブを 6 つにすると 1 つあたりの
 * 幅が狭まり、OS の上限の 5 も超える）。
 *
 * タブバーは OS のもの（`expo-router/native-tabs` の `NativeTabs`）。iOS 26 以降は
 * Liquid Glass で浮き、下へスクロールすると縮む（`minimizeBehavior`）。地の色と
 * 区切りは OS が描き、`backgroundColor` 等は効かない。Android は Material 3 の
 * タブバーで、地の色・選択中の印の色・ラベルの常時表示をここで決める。
 * アイコンは iOS が SF Symbols（選択中は塗り）、Android が Material Symbols
 * （`expo-symbols` が描く）。
 *
 * 各タブはそれぞれ 1 画面だけのスタック（`(home)/_layout.tsx` 等）。OS の
 * ヘッダー（左寄せの見出し・透ける帯）はネイティブスタックのもので、タブの入口に
 * 出すにはタブごとにスタックを入れる必要がある。URL は変えない（ホームは
 * グループ `(home)` に入れて `/` のまま）。詳細の画面はタブの中ではなくルートの
 * スタックに積む（理由は `app/_layout.tsx`）。
 * 却下: JS のタブバーと自前のヘッダーを残し `Stack.Header asChild` で差し込む形
 * （ガラスのヘッダー・タブバーが得られない）。
 *
 * `NativeTabs` は expo-router で unstable の API。SDK を上げるたびにこのファイルの
 * props（`minimizeBehavior`・`labelStyle`・`Trigger.Icon` の `md` 等）を見直す。
 * 実機の階層に「ブックマーク」（`book` の記号の OS 標準の説明）が見えるのは、ボタン
 * （名前はラベルどおり「レッスン」）の中の記号の画像で、OS が付ける。props では消せず、
 * ボタンの名前はラベルで正しいので放置する（`accessibilityLabel` を足しても二重になるだけ）。
 * タブバーの高さは OS 任せで JS から読めない（トーストの位置は `toast.tsx` の
 * 定数で持つ）。
 */
export default function TabsLayout() {
  const t = useTranslations("nav");
  return (
    <NativeTabs
      tintColor={colors.selected}
      minimizeBehavior="onScrollDown"
      labelStyle={{
        default: { ...LABEL_STYLE, color: colors.mutedForeground },
        selected: { ...LABEL_STYLE, color: colors.selected },
      }}
      // ここから下は Android だけに効く
      backgroundColor={colors.card}
      labelVisibilityMode="labeled"
      indicatorColor={colors.surface100}
    >
      <NativeTabs.Trigger name="(home)" testID="tab-home">
        <NativeTabs.Trigger.Label>{t("home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house.fill" }}
          md="home"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dojo" testID="tab-dojo">
        <NativeTabs.Trigger.Label>{t("dojo")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="figure.martial.arts"
          md="sports_martial_arts"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="practice" testID="tab-practice">
        <NativeTabs.Trigger.Label>{t("practice")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "dumbbell", selected: "dumbbell.fill" }}
          md="fitness_center"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lessons" testID="tab-lessons">
        <NativeTabs.Trigger.Label>{t("learn")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "book", selected: "book.fill" }}
          md="menu_book"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="score-table" testID="tab-score-table">
        <NativeTabs.Trigger.Label>{t("scoreTable")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "tablecells", selected: "tablecells.fill" }}
          md="table_chart"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
