import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import {
  BeltIcon,
  BookIcon,
  DumbbellIcon,
  HomeIcon,
  TableIcon,
} from "../../components/icons/icons";
import { colors } from "../../lib/theme";

/**
 * 下部タブ
 *
 * web のモバイル下部タブバー（`TAB_BAR_NAV_ITEMS`）と同じ並び: ホーム・道場・
 * 練習・レッスン・点数表。起動時は先頭のホームを開く。web がドロワーと
 * アカウントのメニューに置く設定は、どちらも持たないモバイルではマイページ
 * （ホームのヘッダー右の人型のアイコン）の奥に置く（タブを 6 つにすると
 * 1 つあたりの幅が狭まり、OS の上限の 5 も超える）。
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
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} />,
        }}
      />
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
    </Tabs>
  );
}
