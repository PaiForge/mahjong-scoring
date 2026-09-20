import type { YakuHanEntry } from "./types";
import { YAKUMAN_HAN } from "../../score/tiers";

// 役満の翻数は MANGAN_PLUS_TIERS が唯一の定義。役の一覧と一緒に引けるよう再エクスポートする。
export { YAKUMAN_HAN };

/**
 * 役翻数練習で出題する役と翻数の一覧
 * 翻数の低い順（門前基準）に並べる。
 *
 * - nakiHan 省略 = 門前限定役（立直・平和など、鳴くと成立しない）
 * - menzenHan と nakiHan が異なる = 食い下がり役（三色・一通・混一など）
 * - menzenHan と nakiHan が同じ = 鳴いても翻数が変わらない役（断么九・役牌・対々和など）
 * - requiresConcealedMelds = 副露があっても成立するが、役の面子は暗刻限定（三暗刻）
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
  // 手に副露があっても成立する（副露してよいのは暗刻 3 つを除く 1 面子）ので
  // nakiHan を持つが、暗刻自体は鳴いて作れないため鳴き状態では出題しない。
  // この一覧でこれに当たるのは三暗刻だけ ―― 三槓子は明槓でよく、対々和・
  // 三色同刻・小三元・混老頭と鳴ける役満はいずれも役の面子を鳴いて作れる。
  // 四暗刻は鳴くと成立しないので nakiHan を持たない側に入る。
  { name: "三暗刻", menzenHan: 2, nakiHan: 2, requiresConcealedMelds: true },
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
  { name: "大四喜", menzenHan: YAKUMAN_HAN, nakiHan: YAKUMAN_HAN },
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

/**
 * 役エントリを門前翻数ごとにグループ化する
 * 役翻数グループ化
 *
 * グループの並びは YAKU_HAN_ENTRIES の出現順（翻数の低い順）に従う。
 * 教本の翻数別まとめと役一覧（早見表）が同じ区切り・同じ並びになるよう、
 * 表示側で個別にグループ化せずこの関数を経由させる。
 */
export function groupYakuHanEntriesByMenzenHan(
  entries: readonly YakuHanEntry[],
): readonly {
  readonly han: number;
  readonly entries: readonly YakuHanEntry[];
}[] {
  // 並びは Set の挿入順（= entries の出現順）がそのまま持つ。翻数の一覧と
  // グループの中身を別々の入れ物で持つと、片方だけ直す変更で静かに乖離する。
  const hansInOrder = [...new Set(entries.map((entry) => entry.menzenHan))];
  return hansInOrder.map((han) => ({
    han,
    entries: entries.filter((entry) => entry.menzenHan === han),
  }));
}

/** 役満（13翻）かどうか */
function isYakumanEntry(entry: YakuHanEntry): boolean {
  return entry.menzenHan === YAKUMAN_HAN;
}

/**
 * 食い下がり役（門前と鳴きで翻数が変わる役）かどうか
 * 食い下がり判定
 *
 * `nakiHan` を持たない役は鳴くと成立しない門前限定役であり、食い下がりでは
 * ない。門前と鳴きで翻数が同じ役（`nakiHan === menzenHan`）も、鳴いても
 * 損をしないので食い下がりには数えない。
 */
export function isKuisagariEntry(entry: YakuHanEntry): boolean {
  return entry.nakiHan !== undefined && entry.nakiHan !== entry.menzenHan;
}

/**
 * 鳴き（副露）状態で出題してよい役かどうか
 * 鳴き出題可否
 *
 * 出題は役名と門前 / 鳴きのバッジだけで、牌を 1 枚も見せない。そのため
 * 「鳴き」は手に副露があることを指しているのに、役の面子を鳴いて作ったと
 * 読まれる。両者が一致する役だけを鳴き状態で出題する。
 *
 * 外れるのは次の 2 つ。
 * - 鳴くと成立しない門前限定役（`nakiHan` を持たない）
 * - 副露があっても成立するが役の面子は暗刻限定の役（{@link YakuHanEntry.requiresConcealedMelds}）。
 *   「鳴き・三暗刻」は事実としては手に副露がある形を指すが、読み手には
 *   「ポンで刻子を 3 つ揃えれば三暗刻」と読めてしまう。副露があっても
 *   三暗刻が成立することは、実際の手牌を並べられる早見表（`reference/yaku`）が
 *   副露形の例で扱う
 */
export function canPromptNaki(
  entry: YakuHanEntry,
): entry is YakuHanEntry & { readonly nakiHan: number } {
  return entry.nakiHan !== undefined && !entry.requiresConcealedMelds;
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

/**
 * 役牌をひとまとめに扱うときの役エントリ名
 * 役牌エントリ名
 *
 * 選択肢側は「役牌 東」「役牌 白」のように風・三元牌を書き分けるが、
 * 翻数と鳴きの扱いはどれも同じなので {@link YAKU_HAN_ENTRIES} では
 * 「役牌」1エントリに集約している。
 */
export const YAKUHAI_ENTRY_NAME = "役牌";
