// 綴りの検査（cspell）はパッケージの置き場所をファイルから探すため、Node の API に触れる。
// このモジュールはテスト（`translation-audit.test.ts`・ストアの素材の検査）だけが読み、
// 画面からは import しない。型は tsconfig の `types` ではなくここで読み込み、辞書の本体に
// Node の型が漏れないようにする（`en.test.ts` と同じ）。
/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import {
  parse,
  TYPE,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";
import { retext } from "retext";
import retextEnglish from "retext-english";
import retextIndefiniteArticle from "retext-indefinite-article";
import retextQuotes from "retext-quotes";
import retextRepeatedWords from "retext-repeated-words";
import retextSentenceSpacing from "retext-sentence-spacing";

import cspellConfig from "../cspell.config.json";
import { AUDIT_PROPER_NOUNS, AUDIT_WORDS } from "./translation-audit-words";

/**
 * 訳文の機械検査（綴り・文法・数・固有名・長さ）
 *
 * @description
 * 英語の辞書の既存の検査（`en.test.ts`・`terminology.test.ts`）は「形」（葉・ICU の引数・
 * 訳語）だけを見て、綴り・文法・数の落ちを拾えない。英語のネイティブのレビューの代わりに
 * 機械の目を 1 つ重ねるのがこのモジュール。辞書の葉 1 つと、ストアの素材の 1 欄
 * （アプリ名・説明文・キーワード等）に同じ関数を掛ける。
 *
 * 道具は cspell（綴り）と retext（文法・文体）で、どちらも Node の中で完結しネットワークに
 * 触れない（cspell の英語の辞書 `@cspell/dict-en_us` は cspell 本体に同梱）。LanguageTool は
 * Java のサーバーか外部の API が要り、訳文を外部へ送ることになるので採らなかった。
 *
 * 規則（{@link AuditRule}）ごとの中身と理由:
 *
 * - `spelling`（error）: cspell の米語の辞書 + 訳語表・用語集から作った語
 *   （{@link AUDIT_WORDS}。ローマ字の麻雀用語・固有名）。ICU の引数（`{count}`）・タグ
 *   （`<link>`）の記法・URL・メールアドレスは文から除いてから掛ける（記法の名前は英単語では
 *   ない）。cspell の既定で 3 文字以下の語は検査しない
 * - `grammar`（error）: retext-english の上で
 *   - retext-indefinite-article — `a` / `an` の取り違え（"an 8,000-point hand"）
 *   - retext-repeated-words — 語の重複（"the the"）
 *   - retext-sentence-spacing — 文と文の間の空白は 1 つ
 *   - retext-quotes — 引用符とアポストロフィは直線（`'`・`"`）に揃え、`’`・`“”` を混ぜない。
 *     混ざると同じ画面で記号の形が割れる。直線に揃えるのは、キーボード（翻訳者・エージェント）
 *     がそのまま打てる形で、アポストロフィは既存の訳もほぼ直線で書かれているため
 * - `number`（error）: 日本語の葉に出る数字の列（`30`・`1,000`）は英語の葉にも出る。
 *   全角の数字は半角に、3 桁区切りのカンマは除いてから比べる（日本語の `1000点` と英語の
 *   `1,000 points` は同じ数）。英語で語として書く数（`two`・`second`・`twice`）は
 *   {@link NUMBER_WORDS} で数として数える — 英語の文体では小さな数を語で書くのが普通で、
 *   落ちではないため。点数・符・翻の数を訳で落とすと、問題文と答えが食い違う
 * - `properNoun`（error）: 日本語の葉に {@link AUDIT_PROPER_NOUNS}（App Store・Apple・Stripe・
 *   Google 等）があれば、英語の葉にも同じ綴りで出る。言い換え（"the store"）で消すと、
 *   規約・料金の案内で誰が何をするかが読めなくなる
 * - `length`（warn）: 英語の文字数が日本語の 3 倍を超える葉。画面の折り返し・はみ出しの
 *   候補として一覧に出すだけで、落とさない（英語は日本語より長いのが普通で、3 倍を超えても
 *   誤りとは限らない。実画面で見て判断する）
 *
 * ICU の `select` は枝ごとに文として検査する（`other` の枝で組んだ文と、他の枝を 1 つずつ
 * 選んだ文）。引数は記号 1 字に置き換えて語の検査から外す — 引数の値が分からないので、
 * 引数の前の `a` / `an` の正否は判定しない。
 *
 * 例外の付け方: {@link TRANSLATION_AUDIT_ALLOW} に `"<規則>:<キー>"`（例:
 * `"number:dojo.ranks.description"`）→ 理由の文を足す。理由は空にできず、使われない例外は
 * `translation-audit.test.ts` が落とす。英語の辞書に無いだけの正しい語は例外ではなく
 * 既知語（`translation-audit-words.ts`。できれば訳語表）に足す。
 */

/**
 * 指摘の種類
 * 検査の規則
 */
export type AuditRule =
  "spelling" | "grammar" | "number" | "properNoun" | "length";

/**
 * 訳文の機械検査の指摘 1 件
 * 検査の指摘
 */
export interface AuditIssue {
  /** 検査した文のキー（辞書の葉なら `<名前空間>.<パス>`） */
  readonly key: string;
  /** 指摘の種類 */
  readonly rule: AuditRule;
  /** 指摘の中身（何がどう違うか） */
  readonly message: string;
  /** `error` はテストを落とす。`warn` は一覧に出すだけ */
  readonly severity: "error" | "warn";
}

/**
 * 訳文の機械検査の例外（`"<規則>:<キー>"` → 理由の文）
 * 検査の例外
 *
 * 規則ごとに分けて持つ（数の例外で綴り・文法の検査まで外さないため）。理由は、なぜその
 * 訳で正しいのか（例: 「日本語の `1日` は英語で `a day` と書く」）を書く。理由の無い例外・
 * 指摘の出ない例外は `translation-audit.test.ts` が落とす。
 */
export const TRANSLATION_AUDIT_ALLOW: Readonly<Record<string, string>> = {
  // 「1つ」「1問ごと」「1日」のような数え方の 1 は、英語では each・a・per で書く
  // （`a` / `an` は数の語として数えない — NUMBER_WORDS の注）
  "number:chiitoitsuScore.learn.pageDescription":
    "「25符の1パターン」の 1 は「常に同じ」の意味で、英語は always 25 fu と書く",
  "number:examTraining.hint": "「1問ごと」は英語で after each question と書く",
  "number:practice.modeTrainingHint":
    "「1問ごと」は英語で after each question と書く",
  "number:gettingStarted.steps.learn.description":
    "「1から学ぶ」は「最初から」の慣用句で、英語は from the very beginning と書く",
  "number:glossary.captions.mentsuteShape":
    "「4面子1雀頭」の 1 雀頭は英語で a pair と書く",
  "number:glossary.terms.mentsute.definition":
    "「1つの雀頭」は英語で a pair と書く",
  "number:glossary.terms.fu-kiriage.usage":
    "「1の位」は英語で the ones digit と書く",
  "number:glossary.terms.han.definition":
    "「翻が1つ増えるごとに」は英語で each extra han と書く",
  "number:glossary.terms.han.usage":
    "「翻が1つ増えると」は英語で each extra han と書く",
  "number:glossary.terms.honba.definition":
    "「1本場につき」「1人あたり」は英語で each honba・each player と書く",
  "number:glossary.terms.ron.usage": "「1本場につき」は英語で per honba と書く",
  "number:glossary.terms.ryanmen.usage":
    "「3つがそろった」の 3 は直前に列挙した平和の条件の数で、英語は 3 つの条件をそのまま並べて書く",
  "number:glossary.terms.shuntsu.usage":
    "順子の 123・456・789 を、英語は牌 1 枚ずつを区切って 1-2-3・4-5-6・7-8-9 と書く",
  "number:machiFu.learn.twoFuBody":
    "辺張の 12・89 を、英語は牌 1 枚ずつを区切って 1-2・8-9 と書く",
  "number:glossary.terms.tehai.usage":
    "「どの3枚を面子と見るか」を英語は split into sets in more than one way と書き、面子が 3 枚であることは sets が持つ",
  "number:manganScoreTable.colKoEach":
    "表の列名「子（1人）」の 1 人は、英語で Non-dealer (each) と書く",
  "number:mypageAccount.notices.emailChangePending":
    "「もう 1 通の確認メール」は 2 通のうち残りの方なので、英語は the other confirmation email と書く",
  "number:oyaRonScores.learn.summaryCleanRows":
    "「1つもない」は英語で no cells と否定で書く",
  "number:practiceQuota.entry.reset":
    "「0:00（日本時間）」は英語で midnight Japan time と書く",
  "number:practiceQuota.entry.signIn":
    "「1日 {limit} 問」の 1 日は英語で a day と書く",
  "number:practiceQuota.paywall.bodyAnonymous":
    "「1 日 {limit} 問」の 1 日は英語で a day と書く",
  "number:practiceQuota.paywall.bodySignedIn":
    "「1 日」は a day、「0:00（日本時間）」は midnight Japan time と英語で書く",
  "number:ronToTsumo.learn.whyBody1": "「4分の1」は英語で a quarter と書く",
  "number:ronToTsumo.learn.whyBody2": "「4分の1」は英語で a quarter と書く",
  "number:settings.yakuOrder.moveDownAria":
    "並べ替えのボタンの読み上げで、「1 つ下へ」は英語で Move down と書く（1 回で 1 つ動く）",
  "number:settings.yakuOrder.moveUpAria":
    "並べ替えのボタンの読み上げで、「1 つ上へ」は英語で Move up と書く（1 回で 1 つ動く）",
  // 語順の違いで数が別の断片へ移るもの（画面は断片の間に牌・用語を挟んで 1 文に組む）
  "number:whyScoringIsComplex.learn.step1Mid":
    "英語は substitute 30 for … and 3 for … の語順で、30 は step1Prefix に移る",
  "number:whyScoringIsComplex.learn.step1Suffix":
    "英語は substitute 30 for … and 3 for … の語順で、3 は step1Mid に移る",
};

/** 例外の一覧のキー（`"<規則>:<キー>"`） */
export function auditAllowKey(rule: AuditRule, key: string): string {
  return `${rule}:${key}`;
}

/** 英語の文の文字数が日本語の何倍を超えたら `length` を出すか */
const LENGTH_RATIO_LIMIT = 3;

/**
 * ICU の引数・URL を置き換える記号（語ではないので綴り・文法の検査に掛からない）
 */
const PLACEHOLDER = "§";

/** URL とメールアドレス（語の検査から外す） */
const URL_OR_EMAIL_PATTERN =
  /\bhttps?:\/\/[^\s<>"')]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

/**
 * 英語で語として書く数（数の一致で、その数が書かれているとみなす）
 * 数の語
 *
 * 基数（zero〜twenty）・序数（first〜tenth）・回数と倍の語（once・twice・double 等。倍の
 * 動詞は活用形も）・月の名前。
 * `a` / `an` は 1 として数えない（どの文にも出るので、1 の落ちを一切拾えなくなる）。
 */
const NUMBER_WORDS: Readonly<Record<string, string>> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
  twenty: "20",
  first: "1",
  second: "2",
  third: "3",
  fourth: "4",
  fifth: "5",
  sixth: "6",
  seventh: "7",
  eighth: "8",
  ninth: "9",
  tenth: "10",
  once: "1",
  single: "1",
  twice: "2",
  // 倍の語は動詞の活用形も数える（日本語の `2倍になる` を英語は `doubles` と書く）
  double: "2",
  doubles: "2",
  doubled: "2",
  doubling: "2",
  triple: "3",
  triples: "3",
  tripled: "3",
  quadruple: "4",
  // 月の名前（日本語の `1月` を英語は `January` / `Jan` と書く）。`may` は助動詞と
  // 同じ綴りで、文に `may` があると 5 の落ちを拾えないが、月の名前を数えない誤りの方が多い
  january: "1",
  jan: "1",
  february: "2",
  feb: "2",
  march: "3",
  mar: "3",
  april: "4",
  apr: "4",
  may: "5",
  june: "6",
  jun: "6",
  july: "7",
  jul: "7",
  august: "8",
  aug: "8",
  september: "9",
  sep: "9",
  sept: "9",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
};

/**
 * ICU の文を解析する（解析できない文は地の文 1 つとして扱う）
 *
 * ストアの素材は ICU ではないが、`{` も `<` も持たない文は ICU として解析しても
 * 地の文 1 つになる。持つ文で解析に失敗したら、記法として読まずにそのまま検査する。
 */
function parseMessage(text: string): readonly MessageFormatElement[] {
  try {
    return parse(text);
  } catch {
    return [{ type: TYPE.literal, value: text }];
  }
}

/** ICU の木にある `select` / `plural`（入れ子の中も含む） */
function selectsOf(
  elements: readonly MessageFormatElement[],
): MessageFormatElement[] {
  return elements.flatMap((element) => {
    if (element.type === TYPE.select || element.type === TYPE.plural) {
      return [
        element,
        ...Object.values(element.options).flatMap((option) =>
          selectsOf(option.value),
        ),
      ];
    }
    if (element.type === TYPE.tag) return selectsOf(element.children);
    return [];
  });
}

/**
 * ICU の木を地の文にする
 *
 * 引数は {@link PLACEHOLDER} に、タグは中身に置き換える。`select` は `chosen` が指す枝
 * （無ければ `other`）を描く。
 */
function render(
  elements: readonly MessageFormatElement[],
  chosen: ReadonlyMap<MessageFormatElement, string>,
): string {
  return elements
    .map((element) => {
      switch (element.type) {
        case TYPE.literal:
          return element.value;
        case TYPE.tag:
          return render(element.children, chosen);
        case TYPE.select:
        case TYPE.plural: {
          const option =
            element.options[chosen.get(element) ?? "other"] ??
            Object.values(element.options)[0];
          return option ? render(option.value, chosen) : "";
        }
        default:
          return PLACEHOLDER;
      }
    })
    .join("");
}

/**
 * ICU の文から、検査に掛ける地の文の組を作る
 *
 * `other` の枝で組んだ文 1 つと、`select` の他の枝を 1 つずつ選んだ文（他の `select` は
 * `other`）。枝の組み合わせを全部は作らない（入れ子が深いと数が爆発し、枝ごとの誤りは
 * 1 つずつ選べば拾える）。URL とメールアドレスは {@link PLACEHOLDER} に置き換える。
 */
function renderVariants(text: string): string[] {
  const elements = parseMessage(text);
  const variants = [
    render(elements, new Map()),
    ...selectsOf(elements).flatMap((select) =>
      select.type === TYPE.select || select.type === TYPE.plural
        ? Object.keys(select.options)
            .filter((option) => option !== "other")
            .map((option) => render(elements, new Map([[select, option]])))
        : [],
    ),
  ];
  return [
    ...new Set(
      variants.map((variant) =>
        variant.replace(URL_OR_EMAIL_PATTERN, PLACEHOLDER),
      ),
    ),
  ];
}

/** ICU の木の地の文をすべて（どの枝のものも）連ねる。数の一致に使う */
function allLiterals(elements: readonly MessageFormatElement[]): string {
  return elements
    .map((element) => {
      switch (element.type) {
        case TYPE.literal:
          return element.value;
        case TYPE.tag:
          return allLiterals(element.children);
        case TYPE.select:
        case TYPE.plural:
          return Object.values(element.options)
            .map((option) => allLiterals(option.value))
            .join(" ");
        default:
          return " ";
      }
    })
    .join("");
}

/** 全角の数字を半角にする（日本語の葉の `３０符` を `30` と数える） */
function toHalfWidthDigits(text: string): string {
  return text.replace(/[０-９]/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
  );
}

/** 文に出る数（3 桁区切りのカンマを除いた数字の列）の集合 */
function numbersOf(text: string): Set<string> {
  const plain = toHalfWidthDigits(text).replace(URL_OR_EMAIL_PATTERN, " ");
  return new Set(
    (plain.match(/\d[\d,]*/g) ?? []).map((run) => run.replace(/,/g, "")),
  );
}

/** 英語の文に語で書かれた数の集合（`two` → `2`） */
function numberWordsOf(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z]+/g) ?? []).flatMap((word) => {
      const value = NUMBER_WORDS[word];
      return value === undefined ? [] : [value];
    }),
  );
}

/** 固有名が文に語として出るか（前後が英字でない位置だけ。`Pro` は `Profile` に当たらない） */
function containsProperNoun(text: string, noun: string): boolean {
  const escaped = noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![A-Za-z])${escaped}(?![A-Za-z])`).test(text);
}

/** cspell-lib の指摘 1 件（使う項目だけ） */
interface CspellIssue {
  readonly text: string;
  readonly isFlagged?: boolean;
}

/** cspell-lib の `spellCheckDocument` の結果（使う項目だけ） */
interface CspellResult {
  readonly issues: readonly CspellIssue[];
  readonly errors?: readonly Error[];
}

/** cspell-lib の API（使う関数だけ） */
interface CspellLib {
  spellCheckDocument(
    document: {
      readonly uri: string;
      readonly text: string;
      readonly languageId: string;
      readonly locale: string;
    },
    options: { readonly noConfigSearch: boolean },
    settings: object,
  ): Promise<CspellResult>;
}

/** 値が `{ ".": { "import": <文字列> } }` を持つ `exports` か */
function importEntryOf(manifest: unknown): string | undefined {
  if (typeof manifest !== "object" || manifest === null) return undefined;
  const exportsField: unknown = Reflect.get(manifest, "exports");
  if (typeof exportsField !== "object" || exportsField === null) {
    return undefined;
  }
  const root: unknown = Reflect.get(exportsField, ".");
  if (typeof root !== "object" || root === null) return undefined;
  const entry: unknown = Reflect.get(root, "import");
  return typeof entry === "string" ? entry : undefined;
}

/**
 * cspell-lib を cspell 本体の依存として読み込む
 *
 * 文を 1 つずつ検査する Node の API（`spellCheckDocument`）は cspell 本体ではなく、本体が
 * 依存する cspell-lib にある。messages の依存は cspell 本体だけで、pnpm は依存の依存を
 * messages から import させないので、本体の置き場所から cspell-lib を探して読む
 * （本体と同じ版が必ず入っている）。読めないのは依存の入れ忘れで、検査を黙って緑にしない
 * よう例外で止める。
 */
async function loadCspellLib(): Promise<CspellLib> {
  const cspellEntry = createRequire(import.meta.url).resolve("cspell");
  const directory = (
    createRequire(cspellEntry).resolve.paths("cspell-lib") ?? []
  )
    .map((nodeModules) => join(nodeModules, "cspell-lib"))
    .find((candidate) => existsSync(join(candidate, "package.json")));
  if (directory === undefined) {
    throw new Error("cspell-lib が cspell 本体の依存に見つからない");
  }
  const manifest: unknown = JSON.parse(
    readFileSync(join(directory, "package.json"), "utf8"),
  );
  const entry = importEntryOf(manifest);
  if (entry === undefined) {
    throw new Error("cspell-lib の package.json に ESM の入口が無い");
  }
  return import(pathToFileURL(join(directory, entry)).href);
}

/** cspell-lib の読み込み（1 回だけ。辞書の読み込みも cspell-lib の中で使い回される） */
let cspellLib: Promise<CspellLib> | undefined;

/**
 * cspell の設定
 *
 * `cspell.config.json`（米語・設定ファイルを探さない・URL とメールを外す）に既知語を足す。
 * 設定ファイルを探さないので、どこから実行しても同じ設定で検査する。
 */
const CSPELL_SETTINGS = {
  ...cspellConfig,
  words: [...AUDIT_WORDS],
};

/** 綴りの検査 */
async function auditSpelling(
  key: string,
  variants: readonly string[],
): Promise<AuditIssue[]> {
  cspellLib ??= loadCspellLib();
  const lib = await cspellLib;
  const result = await lib.spellCheckDocument(
    {
      uri: "file:///translation-audit.txt",
      text: variants.join("\n\n"),
      languageId: "plaintext",
      locale: "en-US",
    },
    { noConfigSearch: true },
    CSPELL_SETTINGS,
  );
  if (result.errors !== undefined && result.errors.length > 0) {
    throw new Error(
      `cspell が検査できない: ${result.errors.map((error) => error.message).join(" / ")}`,
    );
  }
  const words = new Map(
    result.issues.map((issue) => [issue.text, issue.isFlagged === true]),
  );
  return [...words].map(([word, flagged]) => ({
    key,
    rule: "spelling",
    message: flagged ? `使わない語 "${word}"` : `辞書に無い語 "${word}"`,
    severity: "error",
  }));
}

/** 文法・文体の検査器（retext。英語の構文木の上で 4 つの規則を掛ける） */
const grammarProcessor = retext()
  .use(retextEnglish)
  .use(retextIndefiniteArticle)
  .use(retextRepeatedWords)
  .use(retextSentenceSpacing)
  .use(retextQuotes, { preferred: "straight" })
  .freeze();

/** 文法・文体の検査 */
async function auditGrammar(
  key: string,
  variants: readonly string[],
): Promise<AuditIssue[]> {
  const files = await Promise.all(
    variants.map((variant) => grammarProcessor.process(variant)),
  );
  const messages = new Set(
    files.flatMap((file) =>
      file.messages.map(
        (message) => `${message.source ?? "retext"}: ${message.reason}`,
      ),
    ),
  );
  return [...messages].map((message) => ({
    key,
    rule: "grammar",
    message,
    severity: "error",
  }));
}

/** 数の一致の検査 */
function auditNumbers(key: string, en: string, ja: string): AuditIssue[] {
  const enText = allLiterals(parseMessage(en));
  const enNumbers = new Set([...numbersOf(enText), ...numberWordsOf(enText)]);
  const missing = [...numbersOf(allLiterals(parseMessage(ja)))].filter(
    (value) => !enNumbers.has(value),
  );
  return missing.length === 0
    ? []
    : [
        {
          key,
          rule: "number",
          message: `日本語にある数が英語に無い: ${missing.join(", ")}`,
          severity: "error",
        },
      ];
}

/** 固有名の一致の検査 */
function auditProperNouns(key: string, en: string, ja: string): AuditIssue[] {
  return AUDIT_PROPER_NOUNS.filter(
    (noun) => containsProperNoun(ja, noun) && !containsProperNoun(en, noun),
  ).map((noun) => ({
    key,
    rule: "properNoun",
    message: `日本語にある固有名が英語に同じ綴りで無い: ${noun}`,
    severity: "error",
  }));
}

/** 長さの検査（`other` の枝で組んだ地の文の文字数で比べる） */
function auditLength(key: string, en: string, ja: string): AuditIssue[] {
  const enLength = render(parseMessage(en), new Map()).length;
  const jaLength = render(parseMessage(ja), new Map()).length;
  return jaLength > 0 && enLength > jaLength * LENGTH_RATIO_LIMIT
    ? [
        {
          key,
          rule: "length",
          message: `英語 ${enLength} 字 / 日本語 ${jaLength} 字（${LENGTH_RATIO_LIMIT} 倍超）`,
          severity: "warn",
        },
      ]
    : [];
}

/**
 * 1 つの英語の文を、例外を掛けずに検査する
 * 例外前の検査
 *
 * 例外の一覧が実際に指摘を消しているか（使われない例外が無いか）をテストが確かめるために
 * 分けてある。合否の判定には {@link auditEnglishText} を使う。
 *
 * @param key - 文のキー（辞書の葉なら `<名前空間>.<パス>`）
 * @param en - 英語の文（ICU の文でも地の文でもよい）
 * @param ja - 対応する日本語の文。省略すると数・固有名・長さの検査をしない
 */
export async function collectAuditIssues(
  key: string,
  en: string,
  ja?: string,
): Promise<readonly AuditIssue[]> {
  const variants = renderVariants(en);
  const [spelling, grammar] = await Promise.all([
    auditSpelling(key, variants),
    auditGrammar(key, variants),
  ]);
  const paired =
    ja === undefined
      ? []
      : [
          ...auditNumbers(key, en, ja),
          ...auditProperNouns(key, en, ja),
          ...auditLength(key, en, ja),
        ];
  return [...spelling, ...grammar, ...paired];
}

/**
 * 1 つの英語の文を検査する（辞書の葉・ストアの素材の 1 欄に共通）
 * 訳文の検査
 *
 * {@link TRANSLATION_AUDIT_ALLOW} に載った `"<規則>:<キー>"` の指摘は除く。`severity` が
 * `error` の指摘が 1 つでもあれば、その訳文は直すか、理由を付けて例外に載せる。
 *
 * @param key - 文のキー（辞書の葉なら `<名前空間>.<パス>`。例外の照合に使う）
 * @param en - 英語の文（ICU の文でも地の文でもよい）
 * @param ja - 対応する日本語の文。省略すると数・固有名・長さの検査をしない
 */
export async function auditEnglishText(
  key: string,
  en: string,
  ja?: string,
): Promise<readonly AuditIssue[]> {
  const issues = await collectAuditIssues(key, en, ja);
  return issues.filter(
    (issue) =>
      TRANSLATION_AUDIT_ALLOW[auditAllowKey(issue.rule, issue.key)] ===
      undefined,
  );
}
