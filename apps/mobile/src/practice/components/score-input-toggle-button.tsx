import { StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { DropdownIcon, GridIcon } from "../../components/icons/icons";
import { PressableSurface } from "../../components/pressable-surface";
import {
  useDisplaySettingsStore,
  useScoreInput,
} from "../../hooks/use-display-settings-store";
import { borderWidth, colors, radius } from "../../lib/theme";

/**
 * 点数の入力方式の切り替えボタン（web の `ScoreInputToggleButton`）
 * 入力方式の切り替え
 *
 * 点数の欄のラベル行の右端に置き、タイルと選択欄を 1 押しで入れ替える。
 * 参考プロジェクト blindfold-chess の `MoveInputPanel` の切り替えボタンが前例。
 *
 * - **書く先は表示設定ストアの `scoreInput`（永続化される）。** 別の状態は持たない。
 *   設定ページのトグルと同じ値を書くので 2 つの入口が食い違わず、選んだ方式は次の
 *   問題にも設定にも残る（ゲストにも残る）。盤面ごとの一時状態は設定ページとずれるので採らない
 * - **アイコンも `accessibilityLabel` も切り替え先の方式を表す**（今がタイルなら選択欄の
 *   アイコンと「点数を選択欄から選ぶ」）。2 択なので切り替え先を見せれば「押すと何に
 *   なるか」が分かる。現在の方式を描くと「今の状態」か「押した先」かが曖昧になる。
 *   文字のラベルは添えない（保留）
 * - **見た目は無彩色の細枠の小さなボタン**（28×28、枠は `surface300`、押下中は `surface50`）。
 *   緑は「押して始める面」と「?」、墨は「選択中」の記号なので使えない。枠はフォーム部品の
 *   一段濃い灰に合わせる。ラベル行に添える補助の操作なので小さくし、押せる範囲は
 *   `hitSlop` で広げる
 * - **無効化はフォームの `disabled` に追随するだけ**（採点待ち・答え合わせ中・ヘルプの見本）。
 *   チャレンジ・昇級試験の最中でも押せる — 切り替えで時間を失うのは本人の選択で、
 *   制限は掛けない
 */
export function ScoreInputToggleButton({
  disabled = false,
}: {
  readonly disabled?: boolean;
}) {
  const t = useTranslations("practice.scoreInput");
  const scoreInput = useScoreInput();
  const setScoreInput = useDisplaySettingsStore((s) => s.setScoreInput);
  const isTiles = scoreInput === "tiles";

  return (
    <PressableSurface
      onPress={() => setScoreInput(isTiles ? "select" : "tiles")}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled]}
      pressedStyle={styles.pressed}
      hitSlop={8}
      accessibilityLabel={t(isTiles ? "switchToSelect" : "switchToTiles")}
      testID="score-input-toggle"
    >
      {isTiles ? (
        <DropdownIcon size={16} color={colors.surface700} />
      ) : (
        <GridIcon size={16} color={colors.surface700} />
      )}
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: borderWidth.panel,
    borderColor: colors.surface300,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  disabled: {
    opacity: 0.5,
  },
});
