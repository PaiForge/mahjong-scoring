import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { panelFrame } from "../../../lib/panel-styles";
import { colors, radius } from "../../../lib/theme";
import { JudgementMark } from "../../components/judgement-mark";

/** 項目名の列の幅（web の `w-16`） */
const LABEL_COLUMN_WIDTH = 64;

/**
 * 答え合わせの表の外枠（web の `ResultTableFrame`）
 * 結果表の枠
 *
 * 「あなたの回答」と「正解」を並べる表の箱・見出し行・列幅。点数計算の
 * 結果表と、役なしのマスの表（聴牌形の点数計算）で同じ枠を使い、タブを
 * 切り替えても表の形が変わらないようにする。行は呼び出し側が項目
 * （役・翻数・符・点数）ごとに {@link ResultSection} で渡す。
 *
 * 項目名の列だけ固定幅にし、比べさせたい 2 列（あなたの回答 / 正解）は
 * 等分する。中身なりの幅だと問題ごとに列幅が変わり、回答の値が横に動く。
 *
 * 面は白地に淡い枠（`panelFrame`）で、正解の列にだけ中性の灰の薄い帯を
 * 見出しから点数まで通す（web と同じ）。緑にしないのは回答側の正誤の
 * 「正解」の緑と役割が重なるため。帯が行の間で途切れないよう、行の上下の
 * 余白は行ではなく各セルが持つ。内訳の入口は `footer` として表の下に置く。
 */
export function ResultTableFrame({
  children,
  footer,
  embedded = false,
}: {
  readonly children: ReactNode;
  /** 表の下、同じ面の中に続けるもの（翻数・符の内訳の入口） */
  readonly footer?: ReactNode;
  /**
   * 既に白い枠を持つ面の中に置くか（聴牌形の点数計算のタブパネル）。
   * 真なら表自身の枠と内側の余白を外す（白い枠の入れ子にしない）
   */
  readonly embedded?: boolean;
}) {
  const t = useTranslations("agariScore");
  return (
    <View style={embedded ? undefined : styles.frame}>
      <View style={styles.headerRow}>
        <View style={[styles.labelCell, styles.headerCell]} />
        <Text
          style={[styles.valueCell, styles.headerCell, styles.headerText]}
          numberOfLines={1}
        >
          {t("result.headers.answer")}
        </Text>
        <Text
          style={[
            styles.valueCell,
            styles.headerCell,
            styles.headerText,
            styles.correctBand,
            styles.correctBandTop,
          ]}
          numberOfLines={1}
        >
          {t("result.headers.correct")}
        </Text>
      </View>
      {children}
      {footer !== undefined && <View style={styles.footer}>{footer}</View>}
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
  final = false,
  children,
}: {
  /** 先頭の項目（見出しの太線の直下なので罫線を引かない） */
  readonly first?: boolean;
  /**
   * 最後の項目（点数）。翻・符から出る最終的な答えなので、上の区切りを
   * 一段濃くして途中の値と分ける
   */
  readonly final?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <View
      style={[
        !first && styles.sectionDivider,
        final && styles.finalSectionDivider,
      ]}
    >
      {children}
    </View>
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
  final = false,
}: {
  readonly label: string;
  readonly answer: ReactNode;
  readonly correct: ReactNode;
  /**
   * 表の最後の行（点数）。上下の余白を広げて最終結果として分け、正解の
   * 列の帯の下端を丸める。数字をさらに大きくしないのは、ツモの支払い
   * （「1300・2600」等）が列に収まらなくなるため
   */
  readonly final?: boolean;
}) {
  const cell = final ? styles.finalCell : styles.cell;
  return (
    <View style={styles.row}>
      <Text style={[styles.labelCell, cell, styles.labelText]}>{label}</Text>
      <View style={[styles.valueBox, cell]}>{answer}</View>
      <View
        style={[
          styles.valueBox,
          cell,
          styles.correctBand,
          final && styles.correctBandBottom,
        ]}
      >
        {correct}
      </View>
    </View>
  );
}

/**
 * 「あなたの回答」の未回答セル（web の `ResultUnansweredCell`）
 * 未回答セル
 */
export function ResultUnansweredValue() {
  const t = useTranslations("agariScore");
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
    ...panelFrame,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.surface300,
  },
  headerCell: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  correctBand: {
    backgroundColor: colors.surface50,
    paddingHorizontal: 12,
  },
  correctBandTop: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: "hidden",
  },
  correctBandBottom: {
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surface200,
  },
  finalSectionDivider: {
    borderTopColor: colors.surface300,
  },
  cell: {
    paddingVertical: 8,
  },
  finalCell: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerText: {
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
    // 表の中でいちばん濃くする。直下の正解の値（surface800 の太字）より
    // 淡いと、見出しが値に負けて項目として読めない（web と同じ）
    color: colors.surface900,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.surface200,
  },
  row: {
    flexDirection: "row",
    // 正解の列の帯を行の高さいっぱいに伸ばす（値は各セルの中で上に寄る）
    alignItems: "stretch",
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
