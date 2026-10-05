import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslations } from "use-intl";

import {
  BookIcon,
  DumbbellIcon,
  SettingsIcon,
  TableIcon,
} from "../../components/icons/icons";
import { colors } from "../../lib/theme";

/**
 * 下部タブ
 *
 * web のモバイル下部タブバー（`TAB_BAR_NAV_ITEMS`）に揃える: 練習・レッスン・
 * 点数表。web の 4 つ目のランキングはアカウントの記録が要るため、モバイルでは
 * web がドロワーに置く設定を代わりに置く。
 */
export default function TabsLayout() {
  const t = useTranslations("nav");
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary500,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 4,
          borderTopColor: colors.ink,
          // 上端の太枠のぶんだけ既定の高さに足す（足さないとラベルが下で欠ける）
          height: 58 + insets.bottom,
          paddingTop: 4,
        },
      }}
    >
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
