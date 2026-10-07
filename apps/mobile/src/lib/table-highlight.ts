import { StyleSheet } from "react-native";

import { colors } from "./theme";

/**
 * 表のハイライト配色（web の `_lib/table-highlight`）
 * 表ハイライト配色
 *
 * 「いま参照している場所」を表の中で指すための塗り。琥珀はこのアプリで一貫して
 * 「ここに注目」を担う色で、緑（押せる面・正解）と朱（満貫以上）とは分ける。
 * 濃さは最も薄い段に取り、強く指したいときは濃さではなく枠線
 * （{@link tableHighlight.focus}）を足す。
 */
export const tableHighlight = StyleSheet.create({
  /** ハイライトされたセル・行の塗り（`bg-amber-50`） */
  cell: {
    backgroundColor: colors.amber50,
  },
  /** ハイライトされた行見出し・列見出しの塗り */
  header: {
    backgroundColor: colors.amber50,
  },
  /** ハイライトされた行見出し・列見出しの文字色（`text-amber-900`） */
  headerText: {
    color: colors.warningStrong,
  },
  /**
   * 注目している当のセル。行・列のハイライトと交わる 1 マスなので、枠線を
   * 足して交点だと分かるようにする（`ring-2 ring-inset ring-amber-500`）
   */
  focus: {
    backgroundColor: colors.amber50,
    borderWidth: 2,
    borderColor: colors.amber500,
  },
});
