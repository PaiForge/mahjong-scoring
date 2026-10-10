import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import type { ChartDataPoint } from "@mahjong-scoring/features/my-record/types";

import { colors } from "../lib/theme";

const CHART_HEIGHT = 200;
const PADDING = { top: 10, right: 12, bottom: 24, left: 32 } as const;
const Y_TICKS = 4;

/** 目盛りの上端（最大値以上で、4 等分が整数になる値） */
function niceMax(max: number): number {
  if (max <= 0) return Y_TICKS;
  return Math.ceil(max / Y_TICKS) * Y_TICKS;
}

/**
 * スコアの推移（web のマイレコードの折れ線グラフ）
 * スコアチャート
 *
 * 日ごとの平均スコアを、選んだ期間は緑の実線、1 つ前の期間は灰色の破線で
 * 重ねる。点の無い日は飛ばして線をつなぐ（web の `connectNulls`）。web の
 * recharts の代わりに react-native-svg で描く — 必要なのは 2 本の折れ線と
 * 目盛りだけで、チャートのライブラリを足すほどではない。
 *
 * web のツールチップ（点に重ねると値が出る）の代わりに、値は直近の履歴の
 * 表で読む。前の期間の凡例を押すとその期間へ移る（web と同じ。移れる期間が
 * 無ければ押せない）。
 */
export function ScoreChart({
  data,
  emptyMessage,
  currentLabel,
  previousLabel,
  onPreviousLabelPress,
}: {
  readonly data: readonly ChartDataPoint[];
  readonly emptyMessage: string;
  readonly currentLabel: string;
  readonly previousLabel: string;
  readonly onPreviousLabelPress?: () => void;
}) {
  const [width, setWidth] = useState(0);

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const hasPrevious = data.some((point) => point.previousScore !== undefined);
  const max = niceMax(
    Math.max(
      0,
      ...data.flatMap((point) =>
        [point.score, point.previousScore].filter(
          (value): value is number => value !== undefined,
        ),
      ),
    ),
  );
  const plotWidth = Math.max(0, width - PADDING.left - PADDING.right);
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const xOf = (index: number) =>
    PADDING.left +
    (data.length === 1
      ? plotWidth / 2
      : (plotWidth * index) / (data.length - 1));
  const yOf = (value: number) =>
    PADDING.top + plotHeight - (plotHeight * value) / max;

  const pointsOf = (pick: (point: ChartDataPoint) => number | undefined) =>
    data.flatMap((point, index) => {
      const value = pick(point);
      return value === undefined ? [] : [{ x: xOf(index), y: yOf(value) }];
    });
  const current = pointsOf((point) => point.score);
  const previous = pointsOf((point) => point.previousScore);
  const toPolyline = (points: readonly { x: number; y: number }[]) =>
    points.map(({ x, y }) => `${x},${y}`).join(" ");

  // 日付の目盛りは間引いて最大 5 つ（両端を含む）
  const labelStep = Math.max(1, Math.ceil((data.length - 1) / 4));
  const labelIndexes = data
    .map((_, index) => index)
    .filter((index) => index % labelStep === 0 || index === data.length - 1);

  return (
    <View style={styles.container}>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={`${currentLabel} / ${previousLabel}`}
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
              const value = (max / Y_TICKS) * i;
              const y = yOf(value);
              return (
                <Line
                  key={`grid-${i}`}
                  x1={PADDING.left}
                  x2={width - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke={colors.surface200}
                  strokeDasharray="3 3"
                />
              );
            })}
            {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
              const value = (max / Y_TICKS) * i;
              return (
                <SvgText
                  key={`y-${i}`}
                  x={PADDING.left - 6}
                  y={yOf(value) + 4}
                  fontSize={11}
                  fill={colors.surface500}
                  textAnchor="end"
                >
                  {String(value)}
                </SvgText>
              );
            })}
            {labelIndexes.map((index) => (
              <SvgText
                key={`x-${data[index]?.dateKey}`}
                x={xOf(index)}
                y={CHART_HEIGHT - 6}
                fontSize={11}
                fill={colors.surface500}
                textAnchor={
                  data.length > 1 && index === 0
                    ? "start"
                    : data.length > 1 && index === data.length - 1
                      ? "end"
                      : "middle"
                }
              >
                {data[index]?.date ?? ""}
              </SvgText>
            ))}
            {previous.length > 1 && (
              <Polyline
                points={toPolyline(previous)}
                fill="none"
                stroke={colors.surface400}
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
            )}
            {previous.map(({ x, y }) => (
              <Circle
                key={`p-${x}`}
                cx={x}
                cy={y}
                r={2}
                fill={colors.surface400}
              />
            ))}
            {current.length > 1 && (
              <Polyline
                points={toPolyline(current)}
                fill="none"
                stroke={colors.primary500}
                strokeWidth={2}
              />
            )}
            {current.map(({ x, y }) => (
              <Circle
                key={`c-${x}`}
                cx={x}
                cy={y}
                r={3}
                fill={colors.primary500}
              />
            ))}
          </Svg>
        )}
      </View>
      {hasPrevious && (
        <View style={styles.legend}>
          <LegendItem color={colors.primary500} label={currentLabel} />
          <LegendItem
            color={colors.surface400}
            label={previousLabel}
            onPress={onPreviousLabelPress}
          />
        </View>
      )}
    </View>
  );
}

function LegendItem({
  color,
  label,
  onPress,
}: {
  readonly color: string;
  readonly label: string;
  readonly onPress?: () => void;
}) {
  const content = (
    <>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={[styles.legendText, onPress && styles.legendLink]}>
        {label}
      </Text>
    </>
  );
  if (onPress === undefined) {
    return <View style={styles.legendItem}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [styles.legendItem, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  empty: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: colors.surface500,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 12,
    height: 2,
  },
  legendText: {
    fontSize: 13,
    color: colors.surface600,
  },
  legendLink: {
    fontWeight: "700",
    color: colors.primary700,
  },
  pressed: {
    opacity: 0.5,
  },
});
