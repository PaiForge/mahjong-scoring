import type { YakuHanEntry } from "./types";

/** 役満を表す翻数の内部表現 */
export const YAKUMAN_HAN = 13;

/**
 * 役翻数練習で出題する役と翻数の一覧
 * 翻数の低い順（門前基準）に並べる。
 *
 * - nakiHan 省略 = 門前限定役（立直・平和など、鳴くと成立しない）
 * - menzenHan と nakiHan が異なる = 食い下がり役（三色・一通・混一など）
 * - menzenHan と nakiHan が同じ = 鳴いても翻数が変わらない役（断么九・役牌・対々和など）
 *
 * 役翻数データ
 */
export const YAKU_HAN_ENTRIES: readonly YakuHanEntry[] = [
  // --- 1翻 ---
  // 門前限定
  { name: "立直", menzenHan: 1 },
  { name: "門前清自摸和", menzenHan: 1 },
  { name: "平和", menzenHan: 1 },
  { name: "一盃口", menzenHan: 1 },
  // 鳴きOK・食い下がりなし
  { name: "断么九", menzenHan: 1, nakiHan: 1 },
  { name: "役牌", menzenHan: 1, nakiHan: 1 },
  // 食い下がり（2 → 1翻）
  { name: "三色同順", menzenHan: 2, nakiHan: 1 },
  { name: "一気通貫", menzenHan: 2, nakiHan: 1 },
  { name: "混全帯么九", menzenHan: 2, nakiHan: 1 },

  // --- 2翻 ---
  // 門前限定
  { name: "七対子", menzenHan: 2 },
  // 鳴きOK・食い下がりなし
  { name: "対々和", menzenHan: 2, nakiHan: 2 },
  { name: "三暗刻", menzenHan: 2, nakiHan: 2 },
  { name: "三色同刻", menzenHan: 2, nakiHan: 2 },
  { name: "三槓子", menzenHan: 2, nakiHan: 2 },
  { name: "小三元", menzenHan: 2, nakiHan: 2 },
  { name: "混老頭", menzenHan: 2, nakiHan: 2 },

  // --- 3翻 ---
  // 食い下がり（3 → 2翻）
  { name: "混一色", menzenHan: 3, nakiHan: 2 },
  { name: "純全帯么九", menzenHan: 3, nakiHan: 2 },
  // 門前限定
  { name: "二盃口", menzenHan: 3 },

  // --- 6翻 ---
  // 食い下がり（6 → 5翻）
  { name: "清一色", menzenHan: 6, nakiHan: 5 },

  // --- 役満 ---
  // 門前限定
  { name: "国士無双", menzenHan: YAKUMAN_HAN },
  { name: "四暗刻", menzenHan: YAKUMAN_HAN },
  { name: "九蓮宝燈", menzenHan: YAKUMAN_HAN },
  // 鳴きOK
  { name: "大三元", menzenHan: YAKUMAN_HAN, nakiHan: YAKUMAN_HAN },
  { name: "字一色", menzenHan: YAKUMAN_HAN, nakiHan: YAKUMAN_HAN },
  { name: "小四喜", menzenHan: YAKUMAN_HAN, nakiHan: YAKUMAN_HAN },
  { name: "清老頭", menzenHan: YAKUMAN_HAN, nakiHan: YAKUMAN_HAN },
  { name: "緑一色", menzenHan: YAKUMAN_HAN, nakiHan: YAKUMAN_HAN },
  { name: "四槓子", menzenHan: YAKUMAN_HAN, nakiHan: YAKUMAN_HAN },
];

/**
 * 出題範囲（役のフィルタ区分）
 * 翻数そのものではなく学習目的で区切ることで、どの区分を選んでも
 * 答えが単一の翻数に絞れない（自明にならない）ようにしている。
 *
 * - "no-kuisagari": 食い下がりのない通常役（役満を除く / 翻数 1〜3）
 * - "kuisagari": 食い下がりのある役（三色・一通・チャンタ・純チャン・混一・清一 / 翻数 1〜6）
 * - "all": すべて（役満を含む）
 *
 * 役翻数出題範囲
 */
export type YakuHanRange = "no-kuisagari" | "kuisagari" | "all";

/** デフォルトの出題範囲 */
export const DEFAULT_YAKU_HAN_RANGE: YakuHanRange = "all";

/** 役満（13翻）かどうか */
function isYakumanEntry(entry: YakuHanEntry): boolean {
  return entry.menzenHan === YAKUMAN_HAN;
}

/** 食い下がり役（門前と鳴きで翻数が変わる役）かどうか */
function isKuisagariEntry(entry: YakuHanEntry): boolean {
  return entry.nakiHan !== undefined && entry.nakiHan !== entry.menzenHan;
}

/**
 * 指定した出題範囲に含まれる役エントリを返す
 * 役翻数出題範囲フィルタ
 */
export function getYakuHanEntries(
  range: YakuHanRange,
): readonly YakuHanEntry[] {
  switch (range) {
    case "no-kuisagari":
      return YAKU_HAN_ENTRIES.filter(
        (e) => !isKuisagariEntry(e) && !isYakumanEntry(e),
      );
    case "kuisagari":
      return YAKU_HAN_ENTRIES.filter(isKuisagariEntry);
    case "all":
      return YAKU_HAN_ENTRIES;
  }
}

/** 文字列を妥当な YakuHanRange に正規化する（不正値は既定値にフォールバック） */
export function normalizeYakuHanRange(value: string | undefined): YakuHanRange {
  if (value === "no-kuisagari" || value === "kuisagari" || value === "all") {
    return value;
  }
  return DEFAULT_YAKU_HAN_RANGE;
}
