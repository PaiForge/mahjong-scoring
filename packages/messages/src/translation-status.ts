import type { messages as jaMessages } from "./ja";

/**
 * 翻訳の進み具合（言語ごとの完訳 / 未着手の名前空間）
 *
 * @description
 * 英語は名前空間の単位で段階的に訳す。名前空間は「完訳」か「未着手」のどちらかで、
 * 一部だけ訳した名前空間を英語の辞書（`en.ts`）に束ねない。束ねるのは完訳の
 * 名前空間だけで、未着手の名前空間を日本語や空文字で埋めて形だけ揃えることもしない
 * （英語のページに日本語が混ざる・空の見出しが出る、を型が通ったまま見逃すため）。
 *
 * - 日本語の名前空間は「完訳」「未着手」「対象外」のどれか 1 つに必ず入る（重なりも
 *   漏れも `translation-status.test.ts` が落とす）。名前空間を ja に足したら、英語では
 *   まず `EN_PENDING_NAMESPACES` に足す
 * - 完訳の名前空間は、葉のキー・入れ子の形・ICU の引数が日本語と完全に一致する
 *   （`en.test.ts`）。例外は置かない
 * - 英語で公開するルートが読む名前空間は、すべて完訳でなければならない。ルートと
 *   名前空間の結び付きは {@link EN_ROUTE_NAMESPACES}。型が完訳の名前空間しか受け付けない
 *   ので、未着手の名前空間を依存に書くと型検査で落ちる。ルート側の公開の判定
 *   （英語版を出すか）はアプリがこれを読んで行う
 * - 一般提供（英語を全ページで出す）までに、対象外を除く全名前空間を完訳にする
 *
 * 英語で使う訳語は `terminology.ts` が正典。
 */

/** 日本語の辞書の名前空間（形の正典） */
export type MessageNamespace = keyof typeof jaMessages;

/**
 * 日本語の辞書の形から、値を文字列へ広げた辞書の型
 * 辞書の形
 *
 * 他の言語の辞書がこの形を満たすことで、名前空間・キー・入れ子の形が日本語と揃う
 * ことを型で検査する。型は余分なキーや ICU の引数の食い違いまでは拾わないので、
 * 実行時のテスト（`en.test.ts`）と併用する。
 */
export type DictionaryShape<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? readonly DictionaryShape<Item>[]
    : { readonly [Key in keyof T]: DictionaryShape<T[Key]> };

/** 日本語の辞書の全体の形 */
export type MessagesShape = DictionaryShape<typeof jaMessages>;

/**
 * 英語で完訳した名前空間
 * 英語の完訳名前空間
 *
 * フェーズ 1 の英語ページ（点数表 `/reference/score-table`）と、その全描画・操作経路が
 * 読む名前空間。ソースから次のように列挙した（`getTranslations` / `useTranslations` /
 * features の `use-*.ts` が引く名前空間）。
 *
 * - `scoreTable` — 点数表のページ（`reference/score-table/page.tsx`）と表の部品
 *   （`score-table.tsx`・`normal-score-table.tsx`・`high-score-table.tsx`・
 *   `tsumo-score.tsx`・`kiriage-mangan-note.tsx`・`score-table-modal.tsx`）、
 *   切り替えの選択肢（features の `score-table/use-score-table-options.ts`）、
 *   ページの metadata（`createNamespaceMetadata("scoreTable")`）
 * - `reference` — パンくずの「早見表」（`page.tsx` の `tHub("title")`）と表の下の
 *   「ほかの早見表」（`reference/_components/related-references-section.tsx` の
 *   `reference.<scoreTable|yaku|glossary>.{title,description}`）
 * - `nav` — ヘッダー・ドロワー・タブバー（`(user)/_components/nav-menu.tsx`・
 *   `auth-nav-item.tsx`・`mobile-tab-bar.tsx`・`_lib/nav-items.tsx` の `labelKey`）と
 *   ロゴ（`app/_components/brand-logo.tsx` の `brandMahjong` / `brandScoring`）
 * - `notifications` — ヘッダーの通知のベル（`notification-bell.tsx` の `bell` /
 *   `bellUnread`。ログイン中だけ出る）
 * - `footer` — フッター（`(user)/_components/footer.tsx`）
 * - `metadata` — サイト名・既定のタイトルと説明（`app/_lib/metadata.ts`）
 * - `common` — 遷移待ちの表示（`link-pending.tsx` の `loading`。404 の `LinkButton` が
 *   使う）と参照モーダルの閉じる（`reference-modal.tsx` の `close`。点数表のモーダル）
 * - `notFound` — 404 の見出しと説明・ボタン（`goHome` / `toPractice`）
 * - `errorPage` — エラー境界の見出し・説明・ボタン（`app/error.tsx`・
 *   `app/global-error.tsx`・`(user)/error.tsx` の直書きを統括が辞書へ移したもの）
 *
 * 点数表の数値（`1000`・`2000/4000` 等）は辞書の外（`@mahjong-scoring/core` の値と
 * 呼び出し側の書式）にあり、ここでは扱わない。
 *
 * フェーズ 2（公開教材: LP・レッスンの目次と 19 章・早見表のハブ・役一覧・用語集）で
 * `errorPage` より後の 27 名前空間を足した。翻訳を名前空間のファイル単位で並列に
 * 進めるため、先に日本語の写しを置いてここへ移し、各名前空間の訳が終わったことは
 * `en.test.ts` の「日本語の文字を残さない」（名前空間ごと）が緑になることで確かめる。
 * `gettingStarted`（英語 LP のヒーロー CTA は公開まで `/lessons` を指す）と
 * `lessons`（英語の章では確認問題を出さない）はフェーズ 3 で訳すので未着手のまま。
 */
export const EN_TRANSLATED_NAMESPACES = [
  "metadata",
  "nav",
  "reference",
  "scoreTable",
  "footer",
  "common",
  "notifications",
  "notFound",
  "errorPage",
  "glossary",
  "learnCurriculum",
  "landing",
  "company",
  "ranks",
  "nativeAd",
  "yakuNames",
  "manganKoRon",
  "manganOyaRon",
  "manganKoTsumo",
  "manganOyaTsumo",
  "manganScoreTable",
  "yaku",
  "whyScoringIsHardToLearn",
  "whyScoringIsComplex",
  "jantouFu",
  "mentsuFu",
  "machiFu",
  "tehaiFu",
  "chiitoitsuScore",
  "pinfuScore",
  "menzenMentsuScore",
  "furoScore",
  "fuDoubling",
  "tsumoPayments",
  "ronToTsumo",
  "oyaRonScores",
  "practice",
  "challenge",
  "training",
  "examTraining",
  "examResult",
  "exp",
  "practiceQuota",
  "dojo",
  "aboutThisApp",
  "gettingStarted",
  "tryDemo",
  "agariScore",
  "tenpaiScore",
  "settings",
  "mentsuJantouFu",
  "totalFu",
  "scoreTableChallenge",
  "scoreCalculationChallenge",
  "manganScoreCalculationChallenge",
  "hanCountChallenge",
  "yakuHanChallenge",
  "fuExamChallenge",
  "fuScoreExamChallenge",
  "scoreExamChallenge",
  "pinfuExamChallenge",
  "chiitoitsuExamChallenge",
  "manganExamChallenge",
  "lessons",
  "tryMentsuFu",
] as const satisfies readonly MessageNamespace[];

/** 英語で完訳した名前空間の型（完訳の名前空間だけを受け付ける依存の宣言に使う） */
export type EnTranslatedNamespace = (typeof EN_TRANSLATED_NAMESPACES)[number];

/**
 * 公開の英語の対象外にする名前空間
 * 英語の対象外名前空間
 *
 * 管理画面（`/admin`）は運営者だけが使う日本語の画面で、英語の版を作らない。
 * 管理画面は入れ子の Provider で自分の辞書（`admin`）だけを受け取るので、英語の
 * 辞書に無くてもユーザー向けの画面には影響しない。
 */
export const EN_EXCLUDED_NAMESPACES = [
  "admin",
] as const satisfies readonly MessageNamespace[];

/**
 * 英語で未着手の名前空間
 * 英語の未着手名前空間
 *
 * 英語の辞書に束ねていない名前空間。英語で公開するルートの依存にしてはならない
 * （英語の辞書に無いキーは画面に辞書キーがそのまま出る。日本語へ fallback しない）。
 * 訳し終えたら名前空間ごと {@link EN_TRANSLATED_NAMESPACES} へ移し、`en/` に
 * ファイルを置いて `en.ts` に束ねる。並びは `ja.ts` と同じ。
 */
export const EN_PENDING_NAMESPACES = [
  "deleteAccount",
  "announcements",
  "dashboard",
  "recordCta",
  "terms",
  "privacy",
  "legal",
  "contact",
  "auth",
  "signUp",
  "verifyEmail",
  "forgotPassword",
  "resetPassword",
  "validation",
  "mypage",
  "setupUsername",
  "profileEdit",
  "publicProfile",
  "report",
  "banned",
  "pagination",
  "leaderboard",
  "plan",
  "mypagePlan",
  "mypageAccount",
  "tokushoho",
  "mobilePlan",
  "mobileApp",
] as const satisfies readonly MessageNamespace[];

/**
 * ユーザー向けの全画面に出る殻（ヘッダー・ナビ・フッター・サイト名）が読む名前空間
 * 英語のシェル名前空間
 *
 * 英語で公開するどのルートも、自分の名前空間に加えてこれを読む。
 */
export const EN_SHELL_NAMESPACES = [
  "metadata",
  "nav",
  "notifications",
  "footer",
  "common",
] as const satisfies readonly EnTranslatedNamespace[];

/**
 * 英語の 404 が読む名前空間
 * 英語の 404 名前空間
 *
 * 404 はシェルの中に出るので、シェルの名前空間も含める。
 */
export const EN_NOT_FOUND_NAMESPACES = [
  ...EN_SHELL_NAMESPACES,
  "notFound",
] as const satisfies readonly EnTranslatedNamespace[];

/**
 * 英語のレッスンの章がどれも読む名前空間（章の名前空間を除く）
 * 英語の章の共通名前空間
 *
 * 章のレイアウト（`lessons/_components/learn-page-layout.tsx`）が引く目次・章の
 * 見出し（`learnCurriculum`）、本文の用語のモーダル（`glossary`）、著者の表記
 * （`company`）、広告の札（`nativeAd`）と、本文から開く点数表のモーダル
 * （`scoreTable`）。`lessons`（確認問題・完了・次のレッスン・段級位の目標）は
 * 英語の章では出さないので含めない（フェーズ 3 で訳す）。
 */
const EN_LESSON_CHAPTER_NAMESPACES = [
  ...EN_SHELL_NAMESPACES,
  "learnCurriculum",
  "glossary",
  "company",
  "nativeAd",
  "scoreTable",
] as const satisfies readonly EnTranslatedNamespace[];

/**
 * 英語で公開するルートと、そのルートが読む名前空間
 * 英語ルートの依存名前空間
 *
 * キーはロケールの接頭辞を除いたパス。動的ルートはページのテンプレート
 * （`/reference/glossary/[slug]`）で 1 行に書く（アプリの公開の関所
 * `publication-gate.test.ts` が、許可リストの具体的なパスをテンプレートへ畳んで
 * このキーの集合と比べる）。値の型が完訳の名前空間だけを受け付けるので、
 * 未着手の名前空間を書くと型検査で落ちる（実行時にも `translation-status.test.ts` が
 * 完訳であることを検査する）。
 *
 * 各ルートの名前空間は、page と、そこから import で届く `_components`・features の
 * `use-*.ts` が `getTranslations` / `useTranslations` で引く名前空間をソースから
 * 列挙した。レジストリが持つ名前空間の宣言（練習のレジストリの `namespace:` 等）は
 * 描画で読むものではないので数えない。英語で出さない部品（章の確認問題・完了・
 * 練習カード・昇級試験の案内）だけが読む名前空間（`lessons`・`practice`・
 * `challenge`）は含めない。
 *
 * - `/` — LP の各節（`landing`）、運営者の表記（`company`）、目次（`learnCurriculum`）
 * - `/lessons` — 目次と進捗（`learnCurriculum`）、段級位での絞り込み（`ranks`）、広告（`nativeAd`）
 * - `/lessons/<slug>` — {@link EN_LESSON_CHAPTER_NAMESPACES} と章の名前空間
 *   （`chapterNamespace(slug)` = slug の camelCase。数式の `\text{…}` の語
 *   `formula.*` もここ）。満貫の 4 章は満貫の表（`manganScoreTable`）、役の章は
 *   鳴きの比較表の役名（`yakuNames`）も読む
 * - `/reference` — ハブの見出しと各早見表の紹介（`reference`）
 * - `/reference/yaku` — 役一覧（`reference`）、役名（`yakuNames`）、例の手牌の
 *   ツモ / ロンの札（`common`）、広告（`nativeAd`）
 * - `/reference/glossary` — 用語の一覧と索引（`glossary`）、ほかの早見表（`reference`）、広告
 * - `/reference/glossary/[slug]` — 用語の本文（`glossary`）、パンくず（`reference`）、
 *   その語を扱うレッスン（`learnCurriculum`）、広告
 * - `/reference/score-table` — 表（`scoreTable`）とほかの早見表（`reference`）
 *
 * ルートを足すときはその page・`_components`・使う features の `use-*.ts` が引く
 * 名前空間をソースから列挙して足し、先にそれらを完訳にする。
 */
export const EN_ROUTE_NAMESPACES = {
  "/": [...EN_SHELL_NAMESPACES, "landing", "company", "learnCurriculum"],
  "/lessons": [...EN_SHELL_NAMESPACES, "learnCurriculum", "ranks", "nativeAd"],
  "/lessons/why-scoring-is-hard-to-learn": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "whyScoringIsHardToLearn",
  ],
  "/lessons/why-scoring-is-complex": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "whyScoringIsComplex",
  ],
  "/lessons/mangan-ko-ron": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "manganKoRon",
    "manganScoreTable",
  ],
  "/lessons/mangan-ko-tsumo": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "manganKoTsumo",
    "manganScoreTable",
  ],
  "/lessons/mangan-oya-ron": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "manganOyaRon",
    "manganScoreTable",
  ],
  "/lessons/mangan-oya-tsumo": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "manganOyaTsumo",
    "manganScoreTable",
  ],
  "/lessons/yaku": [...EN_LESSON_CHAPTER_NAMESPACES, "yaku", "yakuNames"],
  "/lessons/jantou-fu": [...EN_LESSON_CHAPTER_NAMESPACES, "jantouFu"],
  "/lessons/mentsu-fu": [...EN_LESSON_CHAPTER_NAMESPACES, "mentsuFu"],
  "/lessons/machi-fu": [...EN_LESSON_CHAPTER_NAMESPACES, "machiFu"],
  "/lessons/tehai-fu": [...EN_LESSON_CHAPTER_NAMESPACES, "tehaiFu"],
  "/lessons/chiitoitsu-score": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "chiitoitsuScore",
  ],
  "/lessons/pinfu-score": [...EN_LESSON_CHAPTER_NAMESPACES, "pinfuScore"],
  "/lessons/menzen-mentsu-score": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "menzenMentsuScore",
  ],
  "/lessons/furo-score": [...EN_LESSON_CHAPTER_NAMESPACES, "furoScore"],
  "/lessons/fu-doubling": [...EN_LESSON_CHAPTER_NAMESPACES, "fuDoubling"],
  "/lessons/ron-to-tsumo": [...EN_LESSON_CHAPTER_NAMESPACES, "ronToTsumo"],
  "/lessons/tsumo-payments": [...EN_LESSON_CHAPTER_NAMESPACES, "tsumoPayments"],
  "/lessons/oya-ron-scores": [...EN_LESSON_CHAPTER_NAMESPACES, "oyaRonScores"],
  "/reference": [...EN_SHELL_NAMESPACES, "reference"],
  "/reference/yaku": [
    ...EN_SHELL_NAMESPACES,
    "reference",
    "yakuNames",
    "nativeAd",
  ],
  "/reference/glossary": [
    ...EN_SHELL_NAMESPACES,
    "glossary",
    "reference",
    "nativeAd",
  ],
  "/reference/glossary/[slug]": [
    ...EN_SHELL_NAMESPACES,
    "glossary",
    "reference",
    "learnCurriculum",
    "nativeAd",
  ],
  "/reference/score-table": [...EN_SHELL_NAMESPACES, "scoreTable", "reference"],
} as const satisfies Readonly<Record<string, readonly EnTranslatedNamespace[]>>;
