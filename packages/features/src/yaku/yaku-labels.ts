/**
 * 役名（日本語）から辞書キーへの対応。
 *
 * 役の選択練習と点数計算練習、設定ページの並び替えがいずれも同じ表示名を
 * 出すため、対応表は 1 つに寄せる。このキーで引く辞書は 2 つある:
 *
 * - `agariScore.yaku.<key>` — 練習（役の選択・点数計算の内訳）と設定の表示名。
 *   日本語の値が core の役名と表記の違う行がある（「断幺九」と core の
 *   「断么九」、「東」と core の「役牌 東」等）。練習で見慣れた表記なので変えない
 * - `yakuNames.<key>` — 役一覧（早見表）とレッスンの役名。日本語の値は core の
 *   `YAKU_HAN_ENTRIES.name`（＝この表の日本語のキー）とそのまま一致させる。
 *   役一覧は core の役名を直接描いていたため、`agariScore.yaku` を流用すると
 *   日本語の表示が変わる。英語の値は慣用のローマ字（必要なら英語の説明を添える）
 *
 * `yakuNames` のキー集合がこの表の値と一致し、日本語の値がこの表のキーと一致する
 * ことは `yaku-names.test.ts` が守る。
 */
export const YAKU_TO_KEY: Readonly<Record<string, string>> = {
  立直: "riichi",
  一発: "ippatsu",
  門前清自摸和: "menzen_tsumo",
  断么九: "tanyao",
  平和: "pinfu",
  一盃口: "iipeiko",
  役牌: "yakuhai",
  "役牌 東": "ton",
  "役牌 南": "nan",
  "役牌 西": "sha",
  "役牌 北": "pei",
  "役牌 白": "haku",
  "役牌 發": "hatsu",
  "役牌 中": "chun",
  自風牌: "jikaze",
  場風牌: "bakaze",
  三色同順: "sanshoku_doujun",
  一気通貫: "itsu",
  混全帯么九: "chanta",
  七対子: "chiitoitsu",
  対々和: "toitoi",
  三暗刻: "sanankou",
  三色同刻: "sanshoku_doukou",
  三槓子: "sankantsu",
  小三元: "shosangen",
  混老頭: "honroto",
  ダブル立直: "double_riichi",
  混一色: "honitsu",
  純全帯么九: "junchan",
  二盃口: "ryanpeiko",
  清一色: "chinitsu",
  国士無双: "kokushi",
  四暗刻: "suanko",
  大三元: "daisangen",
  字一色: "tsuiso",
  小四喜: "shousushi",
  大四喜: "daisushi",
  清老頭: "chinroto",
  緑一色: "ryuiso",
  九蓮宝燈: "chuuren",
  四槓子: "sukantsu",
  天和: "tenhou",
  地和: "chihou",
};
