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
 *
 * 練習・昇級試験・道場・体験・はじめ方・はじめに（ゲストが登録なしで回せる学習の輪）を
 * 英語で出すときに `practice` より後の 29 名前空間を同じ手順で足した。`lessons`
 * （確認問題の部品。`/try/mentsu-fu` が読む）と `settings`（和了形・聴牌形の設定
 * フォームが読む）もここで訳す。
 *
 * 会員の画面（認証・ダッシュボード・マイページ・設定と、レッスンの確認問題・完了）を
 * 英語で出すときに `auth` より後の 16 名前空間を同じ手順で足した。
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
  "auth",
  "signUp",
  "verifyEmail",
  "forgotPassword",
  "resetPassword",
  "validation",
  "setupUsername",
  "banned",
  "dashboard",
  "announcements",
  "mypage",
  "mypageAccount",
  "deleteAccount",
  "mypagePlan",
  "profileEdit",
  "pagination",
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
  "recordCta",
  "terms",
  "privacy",
  "legal",
  "contact",
  "publicProfile",
  "report",
  "leaderboard",
  "plan",
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
 * （`scoreTable`）。章末の確認問題・完了の画面・次のレッスンの抜粋（`lessons`）、
 * 級のゴールの案内（`ranks`）、完了後の練習への導線（`practice`）も読む。確認問題の
 * 部品が読む `common`（ツモ / ロンの札等）はシェルに含まれる。
 *
 * 確認問題・完了はログインが要り、ログイン・登録の画面を英語で出すまでは章の依存に
 * 含めていなかった。会員の画面を英語で出すのと一緒に足した。
 */
const EN_LESSON_CHAPTER_NAMESPACES = [
  ...EN_SHELL_NAMESPACES,
  "learnCurriculum",
  "glossary",
  "company",
  "nativeAd",
  "scoreTable",
  "lessons",
  "ranks",
  "practice",
] as const satisfies readonly EnTranslatedNamespace[];

/**
 * 英語で公開するチャレンジ型の練習（昇級試験を含む）の説明ページと、その名前空間
 * 英語の練習一覧
 *
 * messages は練習のレジストリ（features）に依存しない（依存の向きは features →
 * messages）ので写して持つ。写し元は features `practice-menu-types.ts` の
 * `PRACTICE_MENU_REGISTRY`（`practiceHref(slug)` と `namespace`。並びも同じ）。web の
 * 許可リスト（`i18n/translated-publications.ts`）とこの表から作るルートのキーの一致は
 * アプリ側の `publication-gate.test.ts` が検査する。`exam` は昇級試験（`basePath` が
 * `/exam/<級>`）。`introNamespaces` は説明ページだけが追加で読む名前空間 — 役の練習・
 * 翻数の練習・満貫の点数計算は、遊び方のヘルプ（`*-how-to-play.tsx`）が出題の見本の
 * 役名を `yakuNames` で描く（役の練習は役の早見表のモーダルも開く）。
 */
const EN_PRACTICE_MENUS = [
  { path: "/practice/jantou-fu", namespace: "jantouFu", exam: false },
  { path: "/practice/machi-fu", namespace: "machiFu", exam: false },
  { path: "/practice/mentsu-fu", namespace: "mentsuFu", exam: false },
  {
    path: "/practice/mentsu-jantou-fu",
    namespace: "mentsuJantouFu",
    exam: false,
  },
  { path: "/practice/total-fu", namespace: "totalFu", exam: false },
  {
    path: "/practice/yaku",
    namespace: "yaku",
    exam: false,
    introNamespaces: ["yakuNames"],
  },
  {
    path: "/practice/score-table",
    namespace: "scoreTableChallenge",
    exam: false,
  },
  {
    path: "/practice/score-calculation",
    namespace: "scoreCalculationChallenge",
    exam: false,
  },
  { path: "/practice/han-count", namespace: "hanCountChallenge", exam: false },
  {
    path: "/practice/yaku-han",
    namespace: "yakuHanChallenge",
    exam: false,
    introNamespaces: ["yakuNames"],
  },
  {
    path: "/practice/mangan-score-calculation",
    namespace: "manganScoreCalculationChallenge",
    exam: false,
    introNamespaces: ["yakuNames"],
  },
  { path: "/exam/mangan", namespace: "manganExamChallenge", exam: true },
  { path: "/exam/fu", namespace: "fuExamChallenge", exam: true },
  {
    path: "/exam/chiitoitsu",
    namespace: "chiitoitsuExamChallenge",
    exam: true,
  },
  { path: "/exam/pinfu", namespace: "pinfuExamChallenge", exam: true },
  { path: "/exam/fu-score", namespace: "fuScoreExamChallenge", exam: true },
  { path: "/exam/score", namespace: "scoreExamChallenge", exam: true },
] as const satisfies readonly {
  readonly path: string;
  readonly namespace: EnTranslatedNamespace;
  readonly exam: boolean;
  readonly introNamespaces?: readonly EnTranslatedNamespace[];
}[];

/**
 * 全練習の名前空間（練習一覧・道場・体験のカードが variant のラベルで読む）
 * 英語の全練習名前空間
 */
const EN_ALL_PRACTICE_NAMESPACES: readonly EnTranslatedNamespace[] =
  EN_PRACTICE_MENUS.map((menu) => menu.namespace);

/**
 * 練習・昇級試験の説明ページが読む名前空間（練習の名前空間を除く）
 * 英語の練習説明名前空間
 *
 * `PracticeIntroContent` が常に読む `challenge`・`practice`・`training`・`dojo`・
 * `ranks`、関連レッスン（`learnCurriculum`）、広告（`nativeAd`）。昇級試験は模試の
 * 案内（`examTraining`）も読む（{@link practiceMenuRoutes}）。
 */
const EN_PRACTICE_INTRO_NAMESPACES = [
  ...EN_SHELL_NAMESPACES,
  "challenge",
  "practice",
  "training",
  "dojo",
  "ranks",
  "learnCurriculum",
  "nativeAd",
] as const satisfies readonly EnTranslatedNamespace[];

/**
 * 練習・昇級試験の play が読む名前空間（練習の名前空間を除く）
 * 英語の練習 play 名前空間
 *
 * チャレンジの殻・時計・判定（`challenge`・`practice`）、答え合わせの点数表の
 * 参照（`scoreTable`）、回数制限と課金の案内（`practiceQuota`）、役名（`agariScore`
 * の `yaku`）。答え合わせの役の内訳（共有の `YakuBreakdown`）・翻数の練習の出題と一覧・
 * 満貫の点数計算の成立役の表と、そこから開く役の早見表は、core の役名を `yakuNames`
 * で描く（点数系の練習と昇級試験の play が読む。符だけの練習は読まないが、束は和で持つ）。
 */
const EN_PRACTICE_PLAY_NAMESPACES = [
  ...EN_SHELL_NAMESPACES,
  "challenge",
  "practice",
  "scoreTable",
  "practiceQuota",
  "agariScore",
  "yakuNames",
] as const satisfies readonly EnTranslatedNamespace[];

/**
 * 練習・昇級試験の training（模試）が読む名前空間（練習の名前空間を除く）
 * 英語の練習 training 名前空間
 *
 * play に加えて、`createTrainingView` が読む `training`・`examTraining`。
 */
const EN_PRACTICE_TRAINING_NAMESPACES = [
  ...EN_PRACTICE_PLAY_NAMESPACES,
  "training",
  "examTraining",
] as const satisfies readonly EnTranslatedNamespace[];

/**
 * 練習・昇級試験の result が読む名前空間（練習の名前空間を除く）
 * 英語の練習 result 名前空間
 *
 * 結果の見出しと記録（`challenge`・`practice`）、獲得 EXP（`exp`）、昇級の案内
 * （`ranks`）、答え合わせ（`scoreTable`・`agariScore`。役の内訳と役の早見表の役名は
 * `yakuNames`）、広告。昇級試験は合否（`examResult`）も読む。ランキングのプレビュー
 * （`leaderboard`）は英語では出さない。
 */
const EN_PRACTICE_RESULT_NAMESPACES = [
  ...EN_SHELL_NAMESPACES,
  "challenge",
  "practice",
  "exp",
  "ranks",
  "scoreTable",
  "agariScore",
  "yakuNames",
  "nativeAd",
] as const satisfies readonly EnTranslatedNamespace[];

/**
 * 練習・昇級試験の説明・play・training・result のルートと名前空間
 * 英語の練習ルート依存名前空間
 *
 * 各ルートは共通の束（{@link EN_PRACTICE_INTRO_NAMESPACES} 等）に、レジストリの
 * `namespace`（練習ごとの文言）を足す。昇級試験は説明・play に模試の案内
 * （`examTraining`。training は束に含む）、result に合否（`examResult`）を足す。
 */
function practiceMenuRoutes(): Readonly<
  Record<string, readonly EnTranslatedNamespace[]>
> {
  const routes: Record<string, readonly EnTranslatedNamespace[]> = {};
  for (const menu of EN_PRACTICE_MENUS) {
    const { path, namespace, exam } = menu;
    const introNamespaces: readonly EnTranslatedNamespace[] =
      "introNamespaces" in menu ? menu.introNamespaces : [];
    const examTraining: readonly EnTranslatedNamespace[] = exam
      ? ["examTraining"]
      : [];
    const examResult: readonly EnTranslatedNamespace[] = exam
      ? ["examResult"]
      : [];
    routes[path] = [
      ...EN_PRACTICE_INTRO_NAMESPACES,
      namespace,
      ...examTraining,
      ...introNamespaces,
    ];
    routes[`${path}/play`] = [
      ...EN_PRACTICE_PLAY_NAMESPACES,
      namespace,
      ...examTraining,
    ];
    routes[`${path}/training`] = [
      ...EN_PRACTICE_TRAINING_NAMESPACES,
      namespace,
    ];
    routes[`${path}/result`] = [
      ...EN_PRACTICE_RESULT_NAMESPACES,
      namespace,
      ...examResult,
    ];
  }
  return routes;
}

/**
 * 和了形・聴牌形の点数計算（終わりの無い練習）の設定と play が読む名前空間
 * 英語の無限訓練名前空間
 *
 * 設定フォーム（`settings`・`agariScore`）、盤面と答え合わせ（`agariScore`・
 * `scoreTable`・`challenge`）、役の早見表のモーダル（`reference`）、残り回数と
 * 課金の案内（`practiceQuota`・`training`）、`practice`。聴牌形は自分の文言
 * （`tenpaiScore`）を足し、設定フォームは和了形のものを共有する。設定ページは
 * 広告（`nativeAd`）も読む。答え合わせの役の内訳・役チップ・役なしの表と役の早見表は
 * core の役名を `yakuNames` で描く（設定ページも遊び方のヘルプで同じ部品を描く）。
 */
const EN_ENDLESS_PRACTICE_NAMESPACES = [
  ...EN_SHELL_NAMESPACES,
  "agariScore",
  "practice",
  "challenge",
  "scoreTable",
  "reference",
  "settings",
  "training",
  "practiceQuota",
  "yakuNames",
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
 * `use-*.ts` が `getTranslations` / `useTranslations` で引く名前空間と、Server Action が
 * 描く JSX の名前空間をソースから列挙した。練習の説明・play・training・result の
 * 共通の部品（`PracticeIntroContent`・`createPracticeResultPage`・`createTrainingView`
 * 等）はレジストリの `namespace` で `getTranslations` / `useTranslations` を呼ぶので、
 * 練習ごとの名前空間はレジストリの `namespace` から数える（{@link EN_PRACTICE_MENUS}）。
 * 練習一覧・道場・体験のカードは variant のラベルで全練習の名前空間を読む
 * （{@link EN_ALL_PRACTICE_NAMESPACES}）。束は、そのルートの部品がどれかの状態
 * （未ログイン・回数切れ・答え合わせ等）で読む名前空間の和で、常に全部を描くとは限らない。
 * 英語で出さない部品だけが読む名前空間は含めない — ランキングのプレビュー
 * （`leaderboard`。英語ではランキングを提供せず、`/leaderboard` が未公開の間は
 * プレビューも出さない）、料金ページ（`plan`）、お知らせの一覧・詳細の本文。
 *
 * - `/` — LP の各節（`landing`）、運営者の表記（`company`）、目次（`learnCurriculum`）
 * - `/lessons` — 目次と進捗（`learnCurriculum`）、段級位での絞り込み（`ranks`）、広告（`nativeAd`）
 * - `/lessons/<slug>` — {@link EN_LESSON_CHAPTER_NAMESPACES}（確認問題・完了を含む）と章の名前空間
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
 * - `/reference/demo` — 点数計算のデモ（`reference`）と、借りている点数計算の
 *   盤面・答え合わせの部品（`agariScore`・`challenge`・`scoreTable`・`practice`・
 *   `ranks`・`practiceQuota`・`scoreCalculationChallenge`・`manganScoreCalculationChallenge`・
 *   役名の `yakuNames`）
 * - `/practice` — 一覧・絞り込み・カード（`practice`・`ranks`・`dojo`・全練習の名前空間）、
 *   関連レッスン（`learnCurriculum`）、残り回数（`practiceQuota`）、広告
 * - 練習・昇級試験の説明・play・training・result — {@link practiceMenuRoutes}
 * - `/practice/agari-score`・`/practice/tenpai-score` と `/play` —
 *   {@link EN_ENDLESS_PRACTICE_NAMESPACES}
 * - `/dojo` — 段級位と行程（`dojo`・`ranks`・`learnCurriculum`・`practice`・全練習の名前空間）
 * - `/dojo/ranks/[slug]` — 級の詳細（`dojo`・`ranks`）、前提のレッスン（`learnCurriculum`）、
 *   試験の案内（`ranks`）、広告
 * - `/try/agari-score`・`/try/mentsu-fu` — 体験の本文（`tryDemo`・`tryMentsuFu`）と、借りている
 *   練習の部品（`/try/agari-score` は答え合わせの役名 `yakuNames`、`/try/mentsu-fu` は
 *   確認問題の部品 `lessons` と面子の符の `mentsuFu`）
 * - `/getting-started` — はじめ方（`gettingStarted`）
 * - `/lessons/about-this-app` — 章の共通と本文（`aboutThisApp`）、本文に借りている
 *   練習・チャレンジの見本（`practice`（章の共通に含む）・`challenge`・`tenpaiScore`・
 *   `agariScore`・`manganScoreCalculationChallenge`・`jantouFu`。見本の役名は `yakuNames`）
 * - 認証 — `/sign-in`（`auth`）、`/sign-up`（`signUp`・`auth`・パスワードの規則の
 *   `validation`）、`/sign-up/verify-email`（`verifyEmail`・`auth`）、`/forgot-password`
 *   （`forgotPassword`）、`/reset-password`（`resetPassword`・`validation`）、`/banned`
 *   （`banned`）、`/mypage/setup-username`（`setupUsername`）
 * - `/dashboard` — 次にやること・続きから（`dashboard`・`dojo`・`ranks`・
 *   `learnCurriculum`）、練習のバナー（`practice`）、お知らせ（`announcements`）、
 *   練習の表示名の variant（`practiceDisplayTitle`。全練習の名前空間）
 * - `/mypage` — マイページの見出し・メニュー・活動のヒートマップ（`mypage`・`practice`）、
 *   段級位（`ranks`）
 * - `/mypage/challenges`・`/mypage/challenges/results` — 成績（`mypage`・`common`・
 *   `practice`）、ページ送り（`pagination`）、土俵のラベル（`boardLabel`。全練習の名前空間）
 * - `/mypage/notifications` — 通知の一覧（`notifications`）とページ送り（`pagination`）
 * - `/mypage/account`・`/mypage/account/delete` — `mypageAccount`・`deleteAccount`
 * - `/mypage/plan` — 購入状況と履歴（`mypagePlan`）
 * - `/mypage/profile/edit` — `profileEdit`・`mypage`
 * - `/preferences`・`/preferences/yaku-order` — 設定（`settings`）、役の並び（`agariScore` の `yaku`）
 *
 * ルートを足すときはその page・`_components`・使う features の `use-*.ts` が引く
 * 名前空間をソースから列挙して足し、先にそれらを完訳にする。
 */
export const EN_ROUTE_NAMESPACES = {
  "/": [...EN_SHELL_NAMESPACES, "landing", "company", "learnCurriculum"],
  "/lessons": [...EN_SHELL_NAMESPACES, "learnCurriculum", "ranks", "nativeAd"],
  "/lessons/about-this-app": [
    ...EN_LESSON_CHAPTER_NAMESPACES,
    "aboutThisApp",
    "challenge",
    "tenpaiScore",
    "agariScore",
    "manganScoreCalculationChallenge",
    "jantouFu",
    "yakuNames",
  ],
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
  "/reference/demo": [
    ...EN_SHELL_NAMESPACES,
    "reference",
    "agariScore",
    "scoreTable",
    "challenge",
    "practice",
    "ranks",
    "practiceQuota",
    "scoreCalculationChallenge",
    "manganScoreCalculationChallenge",
    "yakuNames",
  ],
  "/practice": [
    ...EN_SHELL_NAMESPACES,
    "practice",
    "ranks",
    "dojo",
    "learnCurriculum",
    "practiceQuota",
    "nativeAd",
    ...EN_ALL_PRACTICE_NAMESPACES,
  ],
  ...practiceMenuRoutes(),
  "/practice/agari-score": [...EN_ENDLESS_PRACTICE_NAMESPACES, "nativeAd"],
  "/practice/agari-score/play": EN_ENDLESS_PRACTICE_NAMESPACES,
  "/practice/tenpai-score": [
    ...EN_ENDLESS_PRACTICE_NAMESPACES,
    "tenpaiScore",
    "nativeAd",
  ],
  "/practice/tenpai-score/play": [
    ...EN_ENDLESS_PRACTICE_NAMESPACES,
    "tenpaiScore",
  ],
  "/getting-started": [...EN_SHELL_NAMESPACES, "gettingStarted"],
  "/try/agari-score": [
    ...EN_SHELL_NAMESPACES,
    "tryDemo",
    "agariScore",
    "training",
    "scoreTable",
    "challenge",
    "reference",
    "practice",
    "ranks",
    "practiceQuota",
    "scoreCalculationChallenge",
    "manganScoreCalculationChallenge",
    "yakuNames",
  ],
  "/try/mentsu-fu": [
    ...EN_SHELL_NAMESPACES,
    "tryMentsuFu",
    "lessons",
    "scoreTable",
    "practice",
    "ranks",
    "mentsuFu",
  ],
  "/dojo": [
    ...EN_SHELL_NAMESPACES,
    "dojo",
    "ranks",
    "learnCurriculum",
    "practice",
    ...EN_ALL_PRACTICE_NAMESPACES,
  ],
  "/dojo/ranks/[slug]": [
    ...EN_SHELL_NAMESPACES,
    "dojo",
    "ranks",
    "learnCurriculum",
    "nativeAd",
  ],
  "/sign-in": [...EN_SHELL_NAMESPACES, "auth"],
  "/sign-up": [...EN_SHELL_NAMESPACES, "signUp", "auth", "validation"],
  "/sign-up/verify-email": [...EN_SHELL_NAMESPACES, "verifyEmail", "auth"],
  "/forgot-password": [...EN_SHELL_NAMESPACES, "forgotPassword"],
  "/reset-password": [...EN_SHELL_NAMESPACES, "resetPassword", "validation"],
  "/banned": [...EN_SHELL_NAMESPACES, "banned"],
  "/dashboard": [
    ...EN_SHELL_NAMESPACES,
    "dashboard",
    "ranks",
    "dojo",
    "learnCurriculum",
    "practice",
    "announcements",
    ...EN_ALL_PRACTICE_NAMESPACES,
  ],
  "/mypage": [...EN_SHELL_NAMESPACES, "mypage", "ranks", "practice"],
  "/mypage/account": [...EN_SHELL_NAMESPACES, "mypageAccount", "deleteAccount"],
  "/mypage/account/delete": [
    ...EN_SHELL_NAMESPACES,
    "mypageAccount",
    "deleteAccount",
  ],
  "/mypage/challenges": [
    ...EN_SHELL_NAMESPACES,
    "mypage",
    "pagination",
    "practice",
    ...EN_ALL_PRACTICE_NAMESPACES,
  ],
  "/mypage/challenges/results": [
    ...EN_SHELL_NAMESPACES,
    "mypage",
    "pagination",
    "practice",
    ...EN_ALL_PRACTICE_NAMESPACES,
  ],
  "/mypage/notifications": [...EN_SHELL_NAMESPACES, "pagination"],
  "/mypage/plan": [...EN_SHELL_NAMESPACES, "mypagePlan"],
  "/mypage/profile/edit": [...EN_SHELL_NAMESPACES, "profileEdit", "mypage"],
  "/mypage/setup-username": [...EN_SHELL_NAMESPACES, "setupUsername"],
  "/preferences": [...EN_SHELL_NAMESPACES, "settings", "agariScore"],
  "/preferences/yaku-order": [...EN_SHELL_NAMESPACES, "settings", "agariScore"],
} as const satisfies Readonly<Record<string, readonly EnTranslatedNamespace[]>>;
