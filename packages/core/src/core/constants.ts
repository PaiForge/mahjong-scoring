import { HaiKind, type Kazehai, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { isHaiKindId } from "./type-guards";

/** 風牌（Kazehai） */
export const KAZEHAI: readonly Kazehai[] = [
  HaiKind.Ton,
  HaiKind.Nan,
  HaiKind.Sha,
  HaiKind.Pei,
];

/** 三元牌（Sangenhai） */
export const SANGENHAI: readonly HaiKindId[] = [
  HaiKind.Haku,
  HaiKind.Hatsu,
  HaiKind.Chun,
];

/**
 * 数牌の花色ベース値（各花色の1の牌ID）
 * 数牌花色ベース
 */
export const SUIT_BASES: readonly HaiKindId[] = [
  HaiKind.ManZu1,
  HaiKind.PinZu1,
  HaiKind.SouZu1,
].filter(isHaiKindId);

/**
 * 点数レベル定数
 * 点数レベル
 */
export const ScoreLevel = {
  Normal: "Normal",
  Mangan: "Mangan",
  Haneman: "Haneman",
  Baiman: "Baiman",
  Sanbaiman: "Sanbaiman",
  Yakuman: "Yakuman",
  DoubleYakuman: "DoubleYakuman",
} as const;


/**
 * ライブラリの役名（英語キー）から日本語名へのマッピング
 * 役名変換マップ（点数練習用）
 */
export const SCORE_YAKU_NAME_MAP: Readonly<Record<string, string>> = {
  // 1翻
  Tanyao: "断么九",
  Pinfu: "平和",
  Iipeikou: "一盃口",
  MenzenTsumo: "門前清自摸和",
  Riichi: "立直",
  Ippatsu: "一発",
  Haitei: "海底摸月",
  Houtei: "河底撈魚",
  Rinshan: "嶺上開花",
  Chankan: "槍槓",
  Yakuhai: "役牌",
  Ton: "役牌 東",
  Nan: "役牌 南",
  Sha: "役牌 西",
  Pei: "役牌 北",
  Haku: "役牌 白",
  Hatsu: "役牌 發",
  Chun: "役牌 中",
  // 2翻
  SanshokuDoujun: "三色同順",
  Ikkitsuukan: "一気通貫",
  Honchan: "混全帯么九",
  Chiitoitsu: "七対子",
  Toitoi: "対々和",
  Sanankou: "三暗刻",
  Sankantsu: "三槓子",
  SanshokuDoukou: "三色同刻",
  Honroutou: "混老頭",
  Shousangen: "小三元",
  DoubleRiichi: "ダブル立直",
  // 3翻
  Honitsu: "混一色",
  Junchan: "純全帯么九",
  Ryanpeikou: "二盃口",
  // 6翻
  Chinitsu: "清一色",
  // 役満
  KokushiMusou: "国士無双",
  Suuankou: "四暗刻",
  Daisangen: "大三元",
  Shousuushii: "小四喜",
  Daisuushii: "大四喜",
  Tsuuiisou: "字一色",
  Chinroutou: "清老頭",
  Ryuuiisou: "緑一色",
  ChuurenPoutou: "九蓮宝燈",
  Suukantsu: "四槓子",
  Tenhou: "天和",
  Chiihou: "地和",
};

/**
 * 英語の役名キーから日本語名を取得する
 * 役名日本語変換
 */
export function getYakuNameJa(name: string): string {
  return SCORE_YAKU_NAME_MAP[name] ?? name;
}

/**
 * 判定時に無視する役（ドラ・偶然役など）
 * 判定除外役リスト
 */
export const IGNORE_YAKU_FOR_JUDGEMENT: readonly string[] = [
  "ドラ", "裏ドラ", "一発", "海底摸月", "河底撈魚",
  "嶺上開花", "槍槓", "ダブル立直", "天和", "地和",
];

/**
 * ドロップダウンリスト用の役選択肢（翻数の低い順 = 表示順序）
 * 役選択肢リスト
 */
export const YAKU_OPTIONS: readonly string[] = [
  // 1翻
  "立直", "門前清自摸和", "断么九", "平和", "一盃口",
  "役牌 東", "役牌 南", "役牌 西", "役牌 北",
  "役牌 白", "役牌 發", "役牌 中",
  // 2翻
  "三色同順", "一気通貫", "混全帯么九", "七対子", "対々和",
  "三暗刻", "三色同刻", "三槓子", "小三元", "混老頭",
  // 3翻
  "混一色", "純全帯么九", "二盃口",
  // 6翻
  "清一色",
  // 役満
  "国士無双", "四暗刻", "大三元", "字一色", "小四喜", "大四喜",
  "清老頭", "緑一色", "九蓮宝燈", "四槓子",
];
