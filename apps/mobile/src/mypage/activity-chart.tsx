import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  formatJstDayKeyLong,
  formatJstDayKeyMonthDay,
} from "@mahjong-scoring/features/jst";
import { buildExpBreakdown } from "@mahjong-scoring/features/mypage/exp-breakdown";
import type { MobileMypageActivityDay } from "@mahjong-scoring/features/mypage/mobile-api";
import { menuTypeToMessageKey } from "@mahjong-scoring/features/practice-menu-types";

import { panelFrame } from "../lib/panel-styles";
import { colors, radius } from "../lib/theme";

const BAR_AREA_HEIGHT = 116;
const BAR_MIN_HEIGHT = 4;

/**
 * 経験値のアクティビティ（web のマイページのスマホ幅の棒グラフと詳細）
 * アクティビティ棒グラフ
 *
 * 直近の日ごとの経験値を棒で並べ、棒を押すとその日の練習ごとの内訳を
 * 下に出す（もう一度押すと閉じる）。高さは表示している日の最大値に対する比。
 */
export function ActivityChart({
  days,
}: {
  readonly days: readonly MobileMypageActivityDay[];
}) {
  const t = useTranslations("mypage.heatmap");
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const maxExp = Math.max(0, ...days.map((day) => day.exp));
  const hasAnyActivity = maxExp > 0;
  const selected = days.find((day) => day.date === selectedDate);

  return (
    <View style={styles.container}>
      <View
        style={styles.bars}
        accessibilityRole="list"
        accessibilityLabel={t("barChartAriaLabel")}
      >
        {days.map((day) => {
          const height =
            day.exp > 0 && maxExp > 0
              ? Math.max(
                  BAR_MIN_HEIGHT,
                  Math.round((day.exp / maxExp) * BAR_AREA_HEIGHT),
                )
              : BAR_MIN_HEIGHT;
          const isSelected = day.date === selectedDate;
          return (
            <Pressable
              key={day.date}
              testID={`mypage-activity-${day.date}`}
              onPress={() =>
                setSelectedDate((prev) =>
                  prev === day.date ? undefined : day.date,
                )
              }
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={t("cellAriaLabel", {
                date: day.date,
                amount: day.exp,
              })}
              style={styles.column}
            >
              <Text style={styles.amount}>{day.exp}</Text>
              <View style={styles.barArea}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    day.exp === 0 && styles.barEmpty,
                    isSelected && styles.barSelected,
                  ]}
                />
              </View>
              <Text
                style={[styles.dateLabel, isSelected && styles.dateSelected]}
              >
                {formatJstDayKeyMonthDay(day.date)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!hasAnyActivity && <Text style={styles.empty}>{t("empty")}</Text>}

      <View
        style={[panelFrame, styles.detail]}
        accessibilityLiveRegion="polite"
      >
        {selected === undefined ? (
          <Text style={styles.muted}>{t("detailPanelPlaceholder")}</Text>
        ) : (
          <DayDetail day={selected} />
        )}
      </View>
    </View>
  );
}

/**
 * 選んだ日の合計と練習ごとの内訳（経験値の多い順）
 *
 * アプリが知らない練習種別（サーバーの方が新しい版で増えたもの）は名前を
 * 出せないので、末尾の「その他」1 行にまとめる。落とすと内訳の和が合計と
 * 合わなくなる
 */
function DayDetail({ day }: { readonly day: MobileMypageActivityDay }) {
  const t = useTranslations("mypage.heatmap");
  const tMenu = useTranslations("practice.practices");
  const expSuffix = t("expSuffix");
  const { rows, otherExp } = buildExpBreakdown(day.expByMenuType);
  const lines = [
    ...rows.map(({ menuType, exp }) => ({
      key: menuType,
      label: tMenu(`${menuTypeToMessageKey(menuType)}.shortTitle`),
      exp,
    })),
    ...(otherExp > 0
      ? [{ key: "other", label: t("otherMenuTypes"), exp: otherExp }]
      : []),
  ];

  return (
    <>
      <Text style={styles.detailDate}>{formatJstDayKeyLong(day.date)}</Text>
      <Text style={styles.detailTotal}>
        {t("total")}: {day.exp} {expSuffix}
      </Text>
      {lines.length === 0 ? (
        <Text style={styles.muted}>{t("noActivity")}</Text>
      ) : (
        <View style={styles.breakdown}>
          {lines.map(({ key, label, exp }) => (
            <View key={key} style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{label}</Text>
              <Text style={styles.breakdownValue}>
                {exp} {expSuffix}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  bars: {
    flexDirection: "row",
    gap: 8,
  },
  column: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  amount: {
    fontSize: 12,
    color: colors.surface500,
  },
  barArea: {
    height: BAR_AREA_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: colors.primary600,
  },
  barEmpty: {
    backgroundColor: colors.surface200,
  },
  barSelected: {
    backgroundColor: colors.primary800,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.surface500,
  },
  dateSelected: {
    fontWeight: "700",
    color: colors.foreground,
  },
  empty: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.surface500,
  },
  detail: {
    padding: 16,
    gap: 4,
    backgroundColor: colors.surface50,
    borderRadius: radius.panel,
  },
  muted: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.surface500,
  },
  detailDate: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.surface900,
  },
  detailTotal: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.surface600,
  },
  breakdown: {
    marginTop: 4,
    gap: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.surface600,
  },
  breakdownValue: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.surface600,
  },
});
