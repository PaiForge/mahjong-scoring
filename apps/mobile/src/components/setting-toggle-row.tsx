import { Children, Fragment, useEffect, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";
import { ChevronRightIcon } from "./icons/icons";

/**
 * 設定項目を並べるカード（web の `SettingsCard`）
 *
 * 太枠の白いカードに項目を縦に積み、項目の間を淡い実線で区切る。
 * 押せる面ではないので影は持たない。
 */
export function SettingsCard({ children }: { readonly children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.card}>
      {rows.map((child, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={styles.divider} />}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

/** トラックの幅・高さとつまみの大きさ（web の `h-6 w-11` / `h-5 w-5`） */
const TRACK_WIDTH = 44;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 20;
const THUMB_INSET = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

interface SettingToggleRowProps {
  readonly title: string;
  /** 補足説明。辞書の改行は無視してスマホの幅で折り返す（{@link joinDescriptionLines}） */
  readonly description?: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  /** 見出しの右隣に添える操作（補足を開く「?」等。web の `onInfoClick`） */
  readonly titleAction?: ReactNode;
}

/**
 * 辞書の補足説明の改行を取り除く
 *
 * 辞書の説明文は web の広い幅で読みやすいよう文の切れ目に改行を持つ。
 * スマホの幅ではその改行の直前でも折り返しが起き、「き、」のような
 * 1〜2 文字の行ができる。日本語は語間に空白が要らないので、改行を
 * 取り除いて幅なりに折り返す。
 */
function joinDescriptionLines(description: string): string {
  return description.replace(/\n/g, "");
}

/**
 * 設定トグル行（web の `SettingToggleRow`）
 *
 * 見出し・説明とスイッチを並べた 1 項目。スイッチは web と同じ形に描く:
 * オンでトラックが緑、つまみは白の丸に影（つまみは押せる面の一部なので影を持つ）。
 * OS 標準の `Switch` は iOS と Android で形も色も違うため使わない。
 * 行全体を押すと切り替わる（web の `<label>` と同じ当たり判定）。
 */
export function SettingToggleRow({
  title,
  description,
  checked,
  onChange,
  titleAction,
}: SettingToggleRowProps) {
  // 描画の間ずっと同じ値を使う（ref ではなく state の初期化で 1 度だけ作る）
  const [position] = useState(() => new Animated.Value(checked ? 1 : 0));

  useEffect(() => {
    Animated.timing(position, {
      toValue: checked ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [checked, position]);

  const trackColor = position.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface200, colors.primary500],
  });
  const translateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [0, THUMB_TRAVEL],
  });

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <View style={styles.body}>
        {titleAction === undefined ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            {titleAction}
          </View>
        )}
        {description !== undefined && (
          <Text style={styles.description}>
            {joinDescriptionLines(description)}
          </Text>
        )}
      </View>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.thumb, { transform: [{ translateX }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

interface SettingLinkRowProps {
  readonly onPress: () => void;
  readonly title: string;
  /** 補足説明。辞書の改行は無視してスマホの幅で折り返す */
  readonly description?: string;
}

/**
 * 設定リンク行（web の `SettingLinkRow`）
 *
 * その場で切り替えるには大きすぎる設定（並べ替えなど）を専用画面へ逃がす。
 * 行の形は {@link SettingToggleRow} と揃え、スイッチの位置に矢印が入る。
 */
export function SettingLinkRow({
  onPress,
  title,
  description,
}: SettingLinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.body}>
        <Text style={[styles.title, styles.linkTitle]}>{title}</Text>
        {description !== undefined && (
          <Text style={styles.description}>
            {joinDescriptionLines(description)}
          </Text>
        )}
      </View>
      <ChevronRightIcon size={20} color={colors.surface400} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  divider: {
    height: 2,
    backgroundColor: colors.surface100,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  body: {
    flex: 1,
    paddingRight: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.surface900,
  },
  linkTitle: {
    fontWeight: "600",
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.surface500,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_INSET,
    flexShrink: 0,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
