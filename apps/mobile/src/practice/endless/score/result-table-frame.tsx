import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { colors, radius } from "../../../lib/theme";
import { JudgementMark } from "../../components/judgement-mark";

/** 項目名の列の幅（web の `w-16`） */
const LABEL_COLUMN_WIDTH = 64;

/**
 * 答え合わせの表の外枠（web の `ResultTableFrame`）
 * 結果表の枠
 *
 * 「あなたの回答」と「正解」を並べる表の箱・見出し行・列幅。点数計算の
 * 結果表と、役なしのマスの表（待ち別点数計算）で同じ枠を使い、タブを
 * 切り替えても表の形が変わらないようにする。行は呼び出し側が項目
 * （役・翻数・符・点数）ごとに {@link ResultSection} で渡す。
 *
 * 項目名の列だけ固定幅にし、比べさせたい 2 列（あなたの回答 / 正解）は
 * 等分する。中身なりの幅だと問題ごとに列幅が変わり、回答の値が横に動く。
 */
export function ResultTableFrame({
  children,
}: {
  readonly children: ReactNode;
}) {
  const t = useTranslations("score");
  return (
    <View style={styles.frame}>
      <View style={styles.headerRow}>
        <View style={styles.labelCell} />
        <Text style={[styles.valueCell, styles.headerText]} numberOfLines={1}>
          {t("result.headers.answer")}
        </Text>
        <Text style={[styles.valueCell, styles.headerText]} numberOfLines={1}>
          {t("result.headers.correct")}
        </Text>
      </View>
      {children}
    </View>
  );
}

/**
 * 結果表の項目 1 つ（web の項目ごとの `<tbody>`）
 * 結果表の項目
 *
 * 項目の境目にだけ罫線を引く。値の行とその内訳の行を同じ項目に入れ、
 * 開いた内訳がどの行に付く注釈かを線が言う。
 */
export function ResultSection({
  first = false,
  children,
}: {
  /** 先頭の項目（見出しの太線の直下なので罫線を引かない） */
  readonly first?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <View style={first ? undefined : styles.sectionDivider}>{children}</View>
  );
}

/**
 * 結果表の 1 行（項目名 / あなたの回答 / 正解）
 * 結果表の行
 */
export function ResultRow({
  label,
  answer,
  correct,
}: {
  readonly label: string;
  readonly answer: ReactNode;
  readonly correct: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.labelCell, styles.labelText]}>{label}</Text>
      <View style={styles.valueBox}>{answer}</View>
      <View style={styles.valueBox}>{correct}</View>
    </View>
  );
}

/**
 * 「あなたの回答」の未回答セル（web の `ResultUnansweredCell`）
 * 未回答セル
 */
export function ResultUnansweredValue() {
  const t = useTranslations("score");
  return <Text style={styles.unanswered}>{t("result.unanswered")}</Text>;
}

/**
 * 正誤の色と記号を付けた「あなたの回答」の値
 * 判定付きの値
 */
export function JudgedValue({
  value,
  isCorrect,
}: {
  readonly value: string;
  readonly isCorrect: boolean;
}) {
  const tCommon = useTranslations("common");
  return (
    <View style={styles.judged}>
      <Text
        style={[
          styles.valueText,
          { color: isCorrect ? colors.success : colors.destructive },
        ]}
      >
        {value}
      </Text>
      <JudgementMark
        verdict={isCorrect ? "correct" : "incorrect"}
        accessibilityLabel={tCommon(isCorrect ? "correct" : "incorrect")}
      />
    </View>
  );
}

/** 正解の値（太字） */
export function CorrectValue({ value }: { readonly value: string }) {
  return <Text style={[styles.valueText, styles.correctText]}>{value}</Text>;
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface50,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerText: {
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface600,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.surface200,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  labelCell: {
    width: LABEL_COLUMN_WIDTH,
    paddingRight: 16,
  },
  labelText: {
    fontSize: 14,
    color: colors.surface600,
  },
  valueCell: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 8,
  },
  valueBox: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 8,
    alignItems: "flex-end",
    gap: 6,
  },
  valueText: {
    textAlign: "right",
    fontSize: 14,
  },
  correctText: {
    fontWeight: "700",
    color: colors.surface800,
  },
  judged: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
  },
  unanswered: {
    textAlign: "right",
    fontSize: 14,
    color: colors.surface400,
  },
});
