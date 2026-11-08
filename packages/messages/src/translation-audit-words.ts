import glossary from "./en/glossary.json";
import { TERMINOLOGY } from "./terminology";

/**
 * 英語の文で日本語と同じ綴りのまま書く固有名（訳文の機械検査の語）
 * 固有名の一覧
 *
 * @description
 * 2 つの検査が読む。
 *
 * - 綴り（cspell）の辞書に足す: 英語の辞書に無い会社名・製品名（Supabase・Mailpit 等）を
 *   未知の語として落とさないため
 * - 固有名の一致: 日本語の葉にこの綴りがあれば、英語の葉にも同じ綴りで現れなければ
 *   ならない（`translation-audit.ts` の `properNoun`）。会社名・製品名は訳さず、言い換え
 *   （"the store"・"your phone"）で消すと、利用規約・プライバシーポリシー・料金の案内で
 *   誰が何をするかが読めなくなる
 *
 * 載せるのは日本語の辞書が ASCII のまま書く会社名・製品名と、このアプリの商品名（Pro）だけ。
 * 1 文字の名前（X）は数式や記号と見分けられないので載せない。並びは長い名前を先に置く
 * （`App Store` を `Apple` より先に照合しても結果は変わらないが、読み手が包含を見落とさないため）。
 */
export const AUDIT_PROPER_NOUNS = [
  "App Store",
  "Apple",
  "iPhone",
  "iOS",
  "Android",
  "Google",
  "YouTube",
  "Instagram",
  "Stripe",
  "Amazon",
  "Vercel",
  "Supabase",
  "Resend",
  "Mailpit",
  "Markdown",
  "Pro",
] as const;

/**
 * 訳語表・用語集にない語で、綴りの検査で既知として扱う語（手書き）
 * 手書きの既知語
 *
 * 英語の辞書に無いが、訳文で正しく使う語だけを足す。誤字を足して赤を消さない — 足す前に、
 * その語が訳語表（`terminology.ts`）に載るべき用語かを先に考える（載せれば訳語表から
 * 自動で入る）。
 *
 * - 役名のローマ字（`yakuNames` の見出し。訳語表は点数計算に要る役だけを載せ、役満などの
 *   名前は持たない）
 * - 本文が読みとして添えるローマ字（頭・鳴き・ノーテン・テンパネ等）
 * - 表記法の名前（MPSZ）
 * - 運営者の所在地の地名・建物名（運営者情報と特商法の表記の住所。日本語は漢字で書くので
 *   固有名の一致の対象にはしない）
 * - 米語の辞書に無いだけの英単語（unranked・grade-schooler の schooler）
 */
const HANDWRITTEN_WORDS: readonly string[] = [
  // 役名のローマ字
  "chanta",
  "chiihou",
  "chinroutou",
  "chuuren",
  "daisangen",
  "daisuushii",
  "doujun",
  "doukou",
  "hatsu",
  "chun",
  "honroutou",
  "junchan",
  "junsei",
  "kokushi",
  "musou",
  "poutou",
  "ryanpeikou",
  "ryuuiisou",
  "sankantsu",
  "shousangen",
  "shousuushii",
  "suuankou",
  "suukantsu",
  "tenhou",
  "tsuuiisou",
  "renfonpai",
  // 本文が読みとして添えるローマ字
  "atama",
  "banban",
  "junkara",
  "naki",
  "nobetan",
  "noten",
  "tenpane",
  // 表記法の名前
  "MPSZ",
  // 運営者の所在地
  "Aoyama",
  "Kita",
  "Minato",
  "Mitsuhashi",
  // 米語の辞書に無いだけの英単語
  "schooler",
  "unranked",
];

/** 文から英字の語を取り出す（ハイフン・空白・記号で区切る。cspell も同じ単位で照合する） */
function wordsOf(text: string): string[] {
  return text.match(/[A-Za-z]+/g) ?? [];
}

/**
 * 綴りの検査（cspell）の辞書に足す語
 * 綴りの既知語
 *
 * @description
 * 訳文に出るローマ字の麻雀用語（han・fu・tsumo・chiitoitsu 等）と固有名は英語の辞書に無く、
 * そのままでは綴りの検査が全文で赤になる。語を手で列挙すると訳語表と食い違うので、
 * 訳語表と用語集から作る:
 *
 * - 訳語表（`TERMINOLOGY`）の `en`（基本表記）と `note`（初出の補足に出るローマ字の読み・
 *   別名。例: "Romaji yaochuuhai where a lesson introduces it"）
 * - 用語集の読み（`glossary.terms.<slug>.reading`。用語ページの見出しに出るローマ字）
 * - {@link AUDIT_PROPER_NOUNS} と手書きの既知語
 *
 * `note` は英文なのでローマ字以外の普通の英単語も入るが、英語の辞書に既にある語を
 * 足しても検査は変わらない。逆に `note` の誤字は既知語になって訳文でも見逃すので、
 * 訳語表の英文は丁寧に書く（訳語表の変更は訳語表の担当がレビューする）。
 * 大文字・小文字は区別しない（cspell の既定。文頭の "Tsumo" も "tsumo" で通る）。
 */
export const AUDIT_WORDS: readonly string[] = [
  ...new Set(
    [
      ...TERMINOLOGY.flatMap((entry) => [entry.en, entry.note]),
      ...Object.values(glossary.terms).map((term) => term.reading),
      ...AUDIT_PROPER_NOUNS,
      ...HANDWRITTEN_WORDS,
    ].flatMap(wordsOf),
  ),
].sort();
