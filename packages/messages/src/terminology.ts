/**
 * 英語の訳語表（日本語の用語 → 英語の基本表記）
 *
 * @description
 * 英語の辞書（`en/*.json`）を書くときの正典。訳語を先に 1 つに決めてから翻訳する。
 * 同じ概念を namespace ごとに別の語で訳すと、英語で検索する人の語（"han"・"fu"・
 * "dealer"）と本文がずれ、画面の間でも用語が割れる。
 *
 * 英語の表記は EMA（European Mahjong Association）と WRC（World Riichi Championship）の
 * 英語のルールブックの表記を参照した。採ったのは**語の選び方だけ**で、点数計算の
 * ルール（切り上げ満貫・連風牌の符など）を EMA / WRC の大会ルールへ変えるものではない。
 *
 * - `en` は文中の基本表記（小文字）。UI のラベルやボタンでは先頭を大文字にしてよい
 *   （"Dealer"・"Mangan+"）が、語そのものは変えない
 * - `avoid` は使わない訳語。`terminology.test.ts` が完訳済みの英語の辞書に現れないことを
 *   検査する（"fan"・"parent"・"child" など。親子は dealer / non-dealer で、parent / child と
 *   訳すと親子関係と読まれる）
 * - `note` は初出の補足と、混同しやすい語との区別
 *
 * 数の書き方: `1 han`・`2 han`・`30 fu` は数で形を変えない（han・fu は不変の外来語として
 * 扱う）。英語の複数形のために ICU の `plural` を使わない — アプリの Static Hermes には
 * `Intl.PluralRules` が無く、`plural` は書式に失敗して辞書キーが画面に出る（日本語の辞書と
 * 同じ禁止を `en.test.ts` が掛ける）。数で文型を変えたいときは
 * `{count, select, 1 {...} other {...}}` か `Questions: {count}` のような数に依らない文型にする。
 *
 * 点数（`1,000`・`2,000/4,000` 等）の書式は辞書ではなく呼び出し側の Intl が持つ。
 * 訳語で点数の意味（親から / 子から、ロン / ツモ）を入れ替えないこと。
 */

/**
 * 訳語表の 1 行
 * 訳語
 */
export interface TermEntry {
  /** 日本語の用語（同じ訳語に寄せる表記ゆれを含む） */
  readonly ja: readonly string[];
  /** 英語の基本表記（文中の小文字の形） */
  readonly en: string;
  /** 初出の補足・注意 */
  readonly note: string;
  /**
   * 英語の辞書で使わない語（小文字。単語の境界で照合する）
   *
   * 省略時は検査しない。
   */
  readonly avoid?: readonly string[];
}

/**
 * 訳語表
 * 訳語表
 *
 * 並びは用語の系統順（麻雀全般 → 点数の単位 → 和了の仕方 → 打点の区分 → 親子 →
 * 手の構成 → 待ち → 役 → アプリの画面の呼び名）。
 */
export const TERMINOLOGY = [
  {
    ja: ["リーチ麻雀", "麻雀"],
    en: "riichi mahjong",
    note: "Japanese riichi mahjong. Do not let it read as mahjong solitaire; say riichi mahjong where the context does not make it clear.",
    avoid: ["solitaire"],
  },
  {
    ja: ["翻"],
    en: "han",
    note: "Invariable: 1 han, 2 han. Do not mix in fan.",
    avoid: ["fan", "fans"],
  },
  {
    ja: ["符"],
    en: "fu",
    note: "Introduce once as fu (minipoints), then just fu. Keep it distinct from points (the score).",
  },
  {
    ja: ["ツモ"],
    en: "tsumo",
    note: "Win by self-draw. Payments are split between the other players.",
  },
  {
    ja: ["ロン"],
    en: "ron",
    note: "Win on a discard. The discarder pays the whole amount.",
  },
  {
    ja: ["満貫"],
    en: "mangan",
    note: "Limit hand; explain as a limit hand where the reader meets it first.",
  },
  { ja: ["跳満"], en: "haneman", note: "Limit hand above mangan." },
  { ja: ["倍満"], en: "baiman", note: "Limit hand above haneman." },
  { ja: ["三倍満"], en: "sanbaiman", note: "Limit hand above baiman." },
  {
    ja: ["役満"],
    en: "yakuman",
    note: "The highest limit hand; also the name of the yaku that score it.",
  },
  {
    ja: ["切り上げ満貫"],
    en: "kiriage mangan",
    note: "Rounding 30 fu 4 han and 60 fu 3 han up to mangan. A local rule toggled in settings.",
  },
  {
    ja: ["親"],
    en: "dealer",
    note: "The dealer (East). Never parent.",
    avoid: ["parent", "parents"],
  },
  {
    ja: ["子"],
    en: "non-dealer",
    note: "Any player other than the dealer. Never child.",
    avoid: ["child", "children"],
  },
  {
    ja: ["雀頭"],
    en: "pair",
    note: "Say the winning hand's pair where pair alone is ambiguous. The slug jantou stays as is.",
  },
  {
    ja: ["面子"],
    en: "set",
    note: "A sequence, triplet or quad. Avoid meld for this: meld also means a called (open) set.",
  },
  { ja: ["順子"], en: "sequence", note: "Three consecutive tiles of a suit." },
  {
    ja: ["刻子"],
    en: "triplet",
    note: "Three identical tiles; closed triplet / open triplet for 暗刻 / 明刻.",
  },
  {
    ja: ["槓子"],
    en: "quad",
    note: "Four identical tiles; closed quad / open quad for 暗槓 / 明槓.",
  },
  {
    ja: ["門前"],
    en: "closed hand",
    note: "A hand with no calls. Use closed consistently; do not alternate with concealed.",
    avoid: ["concealed"],
  },
  {
    ja: ["副露した手", "鳴いた手"],
    en: "open hand",
    note: "A hand with at least one called set.",
  },
  { ja: ["待ち"], en: "wait", note: "The tile(s) a ready hand waits on." },
  {
    ja: ["両面"],
    en: "two-sided wait",
    note: "Add ryanmen where a lesson first introduces it.",
  },
  {
    ja: ["嵌張"],
    en: "closed wait",
    note: "Add kanchan where a lesson first introduces it.",
  },
  {
    ja: ["辺張"],
    en: "edge wait",
    note: "Add penchan where a lesson first introduces it.",
  },
  {
    ja: ["単騎"],
    en: "single-tile wait",
    note: "Add tanki where a lesson first introduces it.",
  },
  {
    ja: ["双碰"],
    en: "pair wait",
    note: "Add shanpon where a lesson first introduces it.",
  },
  {
    ja: ["役"],
    en: "yaku",
    note: "Invariable (one yaku, two yaku). Dora is not a yaku: say so consistently in text and in judgments.",
  },
  {
    ja: ["ドラ"],
    en: "dora",
    note: "Bonus tiles. Dora indicator for ドラ表示牌, ura-dora for 裏ドラ.",
  },
  {
    ja: ["点数計算"],
    en: "score calculation",
    note: "In titles prefer wording that matches search intent (Riichi Mahjong Scoring ...).",
  },
  {
    ja: ["点数表", "点数早見表"],
    en: "scoring table",
    note: "Page titles may say Riichi Mahjong Scoring Table.",
  },
  {
    ja: ["チャレンジ"],
    en: "Challenge",
    note: "A timed, recorded attempt with a mistake limit (rank exams included).",
  },
  {
    ja: ["トレーニング"],
    en: "Training",
    note: "Untimed, unrecorded repetition.",
  },
  {
    ja: ["模試"],
    en: "Mock Exam",
    note: "Training for a rank exam: same questions, untimed, unrecorded.",
  },
  { ja: ["レッスン"], en: "Lesson", note: "One chapter of the textbook." },
  {
    ja: ["コラム"],
    en: "Column",
    note: "A background reading chapter between lessons; no completion mark.",
  },
  {
    ja: ["セッション"],
    en: "(not shown)",
    note: "Internal concept only. Never show Session in the UI; call one attempt a Challenge.",
    avoid: ["session", "sessions"],
  },
] as const satisfies readonly TermEntry[];
