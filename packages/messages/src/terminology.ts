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
 * ルールブックに英語の語が無いもの（場ゾロ・本場など）はローマ字を基本表記にし、
 * 初出で英語の説明を添える。
 *
 * - `en` は文中の基本表記（小文字）。UI のラベルやボタンでは先頭を大文字にしてよい
 *   （"Dealer"・"Mangan+"）が、語そのものは変えない。風の名前（East 等）と
 *   段級位名（5 Kyu 等）は固有名として大文字で書く
 * - `avoid` は使わない訳語。`terminology.test.ts` が完訳済みの英語の辞書に現れないことを
 *   検査する（"fan"・"parent"・"child" など。親子は dealer / non-dealer で、parent / child と
 *   訳すと親子関係と読まれる）。`avoid` を足すと、他の名前空間の訳文もその語で落ちる
 *   — 足すのは訳語として誤り・表記ゆれだと言い切れる語だけにする
 * - `note` は初出の補足と、混同しやすい語との区別
 *
 * 用語集（`glossary.terms.<slug>`）の 64 語はすべてこの表に載せる。用語ページの
 * タイトル（`{term} ({reading})`）は、ここに決めた訳語を見出し語か読みのどちらかに
 * 含む（`terminology.test.ts`）。英語で検索する人が引く語でページの名前が付くように
 * するため。見出し語は訳語そのものより説明的にしてよい（七対子の見出しは
 * "Seven pairs"、文中の基本表記は "chiitoitsu"）。
 *
 * 牌の名前は数字 + 色の短い名前で書く（`1 man`・`5 pin`・`9 sou`）。萬子・筒子・索子は
 * 色の名前としては man / pin / sou で、英語の説明（characters / circles / bamboo）は
 * 初出か見出しで添える。字牌は East・South・West・North と white dragon・green dragon・
 * red dragon。順子は `2-3-4 man`、対子は `a pair of 5 man` と書く。
 *
 * 数の書き方: `1 han`・`2 han`・`30 fu` は数で形を変えない（han・fu は不変の外来語として
 * 扱う）。英語の複数形のために ICU の `plural` を使わない — アプリの Static Hermes には
 * `Intl.PluralRules` が無く、`plural` は書式に失敗して辞書キーが画面に出る（日本語の辞書と
 * 同じ禁止を `en.test.ts` が掛ける）。数で文型を変えたいときは
 * `{count, select, 1 {...} other {...}}` か `Questions: {count}` のような数に依らない文型にする。
 *
 * 点数（`1,000`・`2,000/4,000` 等）の書式は辞書ではなく呼び出し側の Intl が持つ。
 * 本文に書く点数は 3 桁区切りのカンマを付け、子のツモは `700/1,300`（子の支払い /
 * 親の支払い）、親のツモは `1,300 all` と書く。
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
 * 並びは用語の系統順（麻雀全般 → 牌の種類 → 場と席 → 点数の単位 → 和了の仕方 →
 * 打点の区分 → 親子と場の点棒 → 手の構成 → 鳴きと門前 → 待ち → 役とドラ →
 * アプリの画面の呼び名 → 段級位）。
 */
export const TERMINOLOGY = [
  {
    ja: ["リーチ麻雀", "麻雀"],
    en: "riichi mahjong",
    note: "Japanese riichi mahjong. Do not let it read as mahjong solitaire; say riichi mahjong where the context does not make it clear.",
    avoid: ["solitaire"],
  },
  {
    ja: ["数牌"],
    en: "number tiles",
    note: "The tiles numbered 1 to 9 in the three suits (man, pin, sou). The counterpart of honor tiles.",
  },
  {
    ja: ["萬子"],
    en: "characters",
    note: "The man suit. Name single tiles 1 man to 9 man; say man (characters) where the suit is introduced.",
  },
  {
    ja: ["筒子"],
    en: "circles",
    note: "The pin suit, also called dots. Name single tiles 1 pin to 9 pin; say pin (circles) where the suit is introduced.",
  },
  {
    ja: ["索子"],
    en: "bamboo",
    note: "The sou suit. Name single tiles 1 sou to 9 sou; say sou (bamboo) where the suit is introduced.",
  },
  {
    ja: ["字牌"],
    en: "honor tiles",
    note: "The four winds and the three dragons. They never form sequences.",
  },
  {
    ja: ["風牌"],
    en: "winds",
    note: "East, South, West and North, always capitalized. Wind tiles where winds alone is unclear.",
  },
  { ja: ["東"], en: "East", note: "Capitalized as a proper name." },
  { ja: ["南"], en: "South", note: "Capitalized as a proper name." },
  { ja: ["西"], en: "West", note: "Capitalized as a proper name." },
  { ja: ["北"], en: "North", note: "Capitalized as a proper name." },
  {
    ja: ["三元牌"],
    en: "dragons",
    note: "White, green and red dragon. Value tiles for every player.",
  },
  {
    ja: ["白"],
    en: "white dragon",
    note: "White alone is fine in a list of dragons.",
  },
  {
    ja: ["發", "発"],
    en: "green dragon",
    note: "Green alone is fine in a list of dragons.",
  },
  {
    ja: ["中"],
    en: "red dragon",
    note: "Red alone is fine in a list of dragons. Not to be confused with the red five (aka dora).",
  },
  {
    ja: ["么九牌", "幺九牌"],
    en: "terminals and honors",
    note: "The 1s and 9s of the suits plus all honor tiles; their sets earn double fu. Romaji yaochuuhai where a lesson introduces it.",
  },
  {
    ja: ["老頭牌"],
    en: "terminals",
    note: "The 1 and 9 of each suit. Not honor tiles: they still form sequences.",
  },
  {
    ja: ["中張牌"],
    en: "simples",
    note: "The number tiles 2 to 8. Their sets earn the lower fu.",
  },
  {
    ja: ["役牌"],
    en: "value tile",
    note: "A dragon, your seat wind or the round wind. A triplet of one is the yaku yakuhai (1 han); a pair of one earns 2 fu.",
  },
  {
    ja: ["オタ風"],
    en: "non-value wind",
    note: "A wind that is neither your seat wind nor the round wind. Its triplet earns fu but no han; its pair earns 0 fu.",
  },
  {
    ja: ["自風"],
    en: "seat wind",
    note: "The wind of your seat (East for the dealer).",
  },
  {
    ja: ["場風"],
    en: "round wind",
    note: "East in the East round, and so on.",
  },
  {
    ja: ["連風牌"],
    en: "double wind",
    note: "A wind that is both your seat wind and the round wind. Its pair is 2 fu or 4 fu depending on the rules.",
  },
  {
    ja: ["場"],
    en: "round",
    note: "East round, South round. Keep hand for one deal (局); do not call a deal a round.",
  },
  {
    ja: ["局"],
    en: "hand",
    note: "One deal, from the starting tiles to a win or a draw. Also used for 手牌; the context tells them apart.",
  },
  {
    ja: ["家"],
    en: "player",
    note: "東家 is the East player, 南家 the South player and so on. 他家 is another player; 上家 the player on your left, 対面 the player across, 下家 the player on your right.",
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
    ja: ["副底", "符底"],
    en: "base fu",
    note: "The 20 fu every hand starts from. Romaji futei where a lesson introduces it.",
  },
  {
    ja: ["門前ロン加符", "門前加符"],
    en: "closed ron bonus",
    note: "The 10 fu for winning by ron with a closed hand.",
  },
  {
    ja: ["ツモ符"],
    en: "tsumo fu",
    note: "The 2 fu for winning by tsumo (not added to a pinfu tsumo).",
  },
  {
    ja: ["待ち符"],
    en: "wait fu",
    note: "The 2 fu for a single-tile, closed or edge wait. Two-sided and pair waits earn none.",
  },
  {
    ja: ["特例等の加符"],
    en: "open pinfu adjustment",
    note: "The 10 fu that lifts an open hand with no other fu (20 fu) to 30 fu. Name the fu breakdown row Open pinfu adjustment.",
  },
  {
    ja: ["符の切り上げ"],
    en: "rounding up fu",
    note: "Rounding the total fu up to the next 10. Keep it distinct from kiriage mangan.",
  },
  {
    ja: ["基本点"],
    en: "basic points",
    note: "Fu times 2 to the power of (han + 2), before multiplying for the paying players.",
  },
  {
    ja: ["場ゾロ"],
    en: "bazoro",
    note: "The 2 han built into the basic points formula (the + 2). Explain it on first mention.",
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
    ja: ["和了", "アガリ"],
    en: "win",
    note: "Verb and noun: win, a win, the winning tile (アガリ牌), a winning hand (和了形). Romaji houra only as the reading.",
  },
  {
    ja: ["放銃"],
    en: "deal in",
    note: "Discarding the tile another player wins on by ron: the player who dealt in pays.",
  },
  {
    ja: ["聴牌"],
    en: "tenpai",
    note: "A ready hand, one tile from winning. Add ready hand where a lesson first introduces it. Spell it tenpai, not tempai.",
    avoid: ["tempai"],
  },
  {
    ja: ["振聴", "フリテン"],
    en: "furiten",
    note: "A tenpai hand that cannot win by ron because a winning tile is among its own discards (or was let pass after riichi).",
  },
  {
    ja: ["流局"],
    en: "exhaustive draw",
    note: "A hand that ends with no winner. Draw alone is fine where the context is clear.",
  },
  {
    ja: ["連荘"],
    en: "renchan",
    note: "The dealer keeps the deal. Explain it as the dealer keeps the deal on first mention.",
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
    ja: ["数え役満"],
    en: "counted yakuman",
    note: "13 han or more scored as a yakuman. Romaji kazoe yakuman where a lesson introduces it.",
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
    ja: ["本場"],
    en: "honba",
    note: "The repeat counter: each honba adds 300 points to a win (100 from each player on a tsumo). 1 honba, 2 honba.",
  },
  {
    ja: ["積み棒"],
    en: "counter sticks",
    note: "The 100-point sticks that show the honba count.",
  },
  {
    ja: ["供託", "立直棒", "リーチ棒"],
    en: "riichi sticks on the table",
    note: "The 1,000 points put down for riichi, taken by the next winner. Riichi stick for a single one.",
  },
  {
    ja: ["手牌"],
    en: "hand",
    note: "All of a player's tiles, called sets included.",
  },
  {
    ja: ["雀頭"],
    en: "pair",
    note: "Say the winning hand's pair where pair alone is ambiguous. The slug jantou stays as is.",
  },
  {
    ja: ["対子"],
    en: "pair",
    note: "Any two identical tiles (toitsu). The winning hand's one pair (雀頭) is also a pair; where both appear, call this a matching pair (its glossary heading).",
  },
  {
    ja: ["面子"],
    en: "set",
    note: "A sequence, triplet or quad. Avoid meld for this: meld also means a called (open) set.",
  },
  {
    ja: ["面子手"],
    en: "standard hand",
    note: "Four sets and a pair, the shape that fu calculation assumes.",
  },
  { ja: ["順子"], en: "sequence", note: "Three consecutive tiles of a suit." },
  {
    ja: ["刻子"],
    en: "triplet",
    note: "Three identical tiles; closed triplet / open triplet for 暗刻 / 明刻.",
  },
  {
    ja: ["暗刻"],
    en: "closed triplet",
    note: "A triplet gathered in your own hand or completed by tsumo. A triplet completed by ron counts as open.",
  },
  {
    ja: ["明刻"],
    en: "open triplet",
    note: "A triplet made by pon, or completed by ron.",
  },
  {
    ja: ["槓子"],
    en: "quad",
    note: "Four identical tiles; closed quad / open quad for 暗槓 / 明槓.",
  },
  {
    ja: ["暗槓"],
    en: "closed quad",
    note: "A quad made from four tiles in your own hand. It keeps the hand closed. Closed kan for the declaration.",
  },
  {
    ja: ["明槓"],
    en: "open quad",
    note: "A quad made with another player's tile (daiminkan or added kan). Open kan for the declaration.",
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
  {
    ja: ["副露", "鳴き"],
    en: "call",
    note: "Verb and noun: call pon, a call, calling. A set made by calling is a called set (open). Not meld, which also names any set.",
  },
  { ja: ["ポン"], en: "pon", note: "Call a discard to make a triplet." },
  {
    ja: ["チー"],
    en: "chii",
    note: "Call the left player's discard to make a sequence.",
  },
  {
    ja: ["カン"],
    en: "kan",
    note: "The declaration that makes a quad: closed kan, daiminkan, added kan.",
  },
  {
    ja: ["加槓"],
    en: "added kan",
    note: "Adding the fourth tile to a triplet made by pon.",
  },
  {
    ja: ["大明槓"],
    en: "daiminkan",
    note: "An open kan called on a discard while holding three of the tile.",
  },
  {
    ja: ["嶺上牌"],
    en: "replacement tile",
    note: "The tile drawn from the dead wall after a kan. Winning on it is rinshan kaihou.",
  },
  {
    ja: ["食い下がり", "喰い下がり"],
    en: "kuisagari",
    note: "Some yaku lose 1 han in an open hand. Explain it as the open-hand han reduction (its glossary heading).",
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
    ja: ["ドラ表示牌"],
    en: "dora indicator",
    note: "The revealed tile; the tile after it is the dora.",
  },
  {
    ja: ["裏ドラ"],
    en: "ura-dora",
    note: "Dora under the indicator, counted only on a riichi win.",
  },
  {
    ja: ["槓ドラ"],
    en: "kan dora",
    note: "The extra dora added by each kan. Kan ura for the extra ura-dora.",
  },
  {
    ja: ["赤ドラ"],
    en: "red five",
    note: "A red-colored 5 that counts as a dora (aka dora). It is the same tile as the plain 5.",
  },
  {
    ja: ["立直", "リーチ"],
    en: "riichi",
    note: "The 1 han yaku declared with a closed tenpai hand.",
  },
  {
    ja: ["一発"],
    en: "ippatsu",
    note: "1 han for winning within one go-around after riichi.",
  },
  {
    ja: ["平和"],
    en: "pinfu",
    note: "Closed, all sequences, a pair that is not a value tile, a two-sided wait. 20 fu by tsumo, 30 fu by ron.",
  },
  {
    ja: ["門前清自摸和", "門前ツモ"],
    en: "menzen tsumo",
    note: "The 1 han yaku for winning by tsumo with a closed hand. Keep it distinct from tsumo fu.",
  },
  {
    ja: ["断么九", "断幺九", "タンヤオ"],
    en: "tanyao",
    note: "Add all simples where a lesson first introduces it.",
  },
  {
    ja: ["喰いタン"],
    en: "kuitan",
    note: "Allowing tanyao in an open hand; a rule option.",
  },
  {
    ja: ["七対子"],
    en: "chiitoitsu",
    note: "Seven pairs; fixed at 25 fu. Add seven pairs where a lesson first introduces it.",
  },
  {
    ja: ["混一色"],
    en: "honitsu",
    note: "Add half flush where a lesson first introduces it.",
  },
  {
    ja: ["清一色"],
    en: "chinitsu",
    note: "Add full flush where a lesson first introduces it.",
  },
  {
    ja: ["対々和"],
    en: "toitoi",
    note: "Add all triplets where a lesson first introduces it.",
  },
  {
    ja: ["三暗刻"],
    en: "sanankou",
    note: "Add three closed triplets where a lesson first introduces it.",
  },
  {
    ja: ["一盃口"],
    en: "iipeikou",
    note: "Add two identical sequences where a lesson first introduces it.",
  },
  {
    ja: ["三色同順"],
    en: "sanshoku",
    note: "Add mixed triple sequence where a lesson first introduces it.",
  },
  {
    ja: ["一気通貫"],
    en: "ittsu",
    note: "Add pure straight where a lesson first introduces it.",
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
  {
    ja: ["道場"],
    en: "Dojo",
    note: "The page that shows your rank and the road to the black belt. A screen name, so always capitalized.",
  },
  {
    ja: ["ライフ"],
    en: "lives",
    note: "The mistakes left in a challenge before it ends. Lives as the label even when one is left.",
  },
  {
    ja: ["スコア"],
    en: "score",
    note: "The number of correct answers in a challenge ({score} correct). Keep it distinct from points (点数), the value of a hand.",
  },
  {
    ja: ["正答率"],
    en: "accuracy",
    note: "The share of correct answers in a challenge, as a percentage (Accuracy 80%).",
  },
  {
    ja: ["自己ベスト", "これまでのベスト"],
    en: "personal best",
    note: "Your best challenge score on the same practice and setting. New personal best! when it is beaten.",
  },
  {
    ja: ["経験値"],
    en: "EXP",
    note: "Experience points earned by practicing. Always written EXP, as in +10 EXP and Lv.3.",
  },
  {
    ja: ["回数制限", "無料枠"],
    en: "daily limit",
    note: "The number of free questions a day for some practice menus. Free questions for the remaining count; it resets at midnight Japan time (JST).",
  },
  {
    ja: ["黒帯"],
    en: "black belt",
    note: "Shodan, the goal of the rank path. The path itself is the Road to the black belt in scoring.",
  },
  {
    ja: ["段級位"],
    en: "rank",
    note: "The kyu and dan ranks as a whole (5 Kyu up to Shodan).",
  },
  {
    ja: ["級"],
    en: "kyu",
    note: "Rank names put the number first: 5 Kyu, 4 Kyu, 3 Kyu, 2 Kyu, 1 Kyu. A smaller number is a higher rank.",
  },
  {
    ja: ["段"],
    en: "dan",
    note: "Rank names above the kyu ranks: 1 Dan, 2 Dan. The first is written Shodan (1 Dan).",
  },
  {
    ja: ["初段"],
    en: "shodan",
    note: "The first dan rank, the black belt of the path. Write Shodan (1 Dan) as a rank name.",
  },
  {
    ja: ["昇級試験", "昇段試験"],
    en: "promotion exam",
    note: "The exam that awards the next kyu or dan rank, for both 昇級 and 昇段. As a title, the rank comes first: 5 Kyu Promotion Exam; a menu name reads Promotion Exam: Scoring Pinfu.",
  },
] as const satisfies readonly TermEntry[];
