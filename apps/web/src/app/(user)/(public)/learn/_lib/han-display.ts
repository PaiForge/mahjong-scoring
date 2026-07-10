/**
 * 満貫以上の種類ごとの翻数レンジ表示（満貫は4翻も含むため "5" 単独にしない）
 * 翻数レンジ表示
 *
 * キーは core の HIGH_SCORES の nameKey と一致する。
 */
export const HAN_DISPLAY: Readonly<Record<string, string>> = {
  mangan: "4 〜 5",
  haneman: "6 〜 7",
  baiman: "8 〜 10",
  sanbaiman: "11 〜 12",
  yakuman: "13 〜",
};
