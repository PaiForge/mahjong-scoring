import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import {
  BeltIcon,
  BookIcon,
  DumbbellIcon,
  SettingsIcon,
  TableIcon,
} from "../../components/icons/icons";
import { colors } from "../../lib/theme";

/**
 * 下部タブ
 *
 * web のモバイル下部タブバー（`TAB_BAR_NAV_ITEMS`）に揃える: 道場・練習・
 * レッスン・点数表。web の先頭のホーム（ダッシュボード）はアカウントの記録から
 * 「次にやること」を出す画面で、モバイルには無い。代わりに次の目標の級を上に
 * 置く道場を先頭にし、起動時もここを開く。web がドロワーに置く設定は、
 * ドロワーを持たないモバイルでは末尾のタブに置く。
 *
 * 見た目は OS 標準のタブバーに寄せる（白地にヘアラインの区切り、高さは既定）。
 * web のモバイル幅のタブバーが持つ太枠は、ネイティブでは見慣れない形なので持たない。
 */
export default function TabsLayout() {
  const t = useTranslations("nav");
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary600,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.surface300,
        },
      }}
    >
      <Tabs.Screen
        name="dojo"
        options={{
          title: t("dojo"),
          tabBarIcon: ({ color }) => <BeltIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: t("practice"),
          tabBarIcon: ({ color }) => <DumbbellIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: t("learn"),
          tabBarIcon: ({ color }) => <BookIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="score-table"
        options={{
          title: t("scoreTable"),
          tabBarIcon: ({ color }) => <TableIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="preferences"
        options={{
          title: t("settings"),
          tabBarIcon: ({ color }) => <SettingsIcon color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
