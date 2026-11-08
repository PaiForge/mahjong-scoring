import { messages } from "@mahjong-scoring/messages/ja";
import type { Messages } from "next-intl";

import type { MessagesForLocale } from "./request";

type MessageNamespace = keyof typeof messages;

/**
 * クライアントに渡さない名前空間
 * サーバー専用名前空間
 *
 * `NextIntlClientProvider` に渡した辞書は、全ページの HTML（RSC ペイロード）と
 * 遷移ごとの RSC 応答に丸ごと載る。辞書は 85 名前空間で 300KB 超あり、その
 * 半分以上は用語集・規約・教本の本文のようにサーバーコンポーネントが
 * `getTranslations()` で読むだけの長文で、クライアントコンポーネントは
 * 一度も引かない。それを全ページで運んでいたため、LP の HTML 387KB のうち
 * 351KB が辞書だった（2026-10 に本番で実測）。
 *
 * ここに挙げた名前空間はクライアントの辞書から外す。クライアント側
 * （`useTranslations`、features の `use-*.ts`、レジストリの `namespace`）が
 * 引いてよいのは残りだけで、ここに挙げた名前空間を引くと本番ではキー文字列が
 * そのまま画面に出る。`client-messages.test.ts` がソースを走査して、ここに
 * 挙げた名前空間がクライアント側のコードから参照されていないことを検査する。
 *
 * 外す基準は「クライアントが参照していない」こと（大きさではない）。名前空間を
 * クライアントで使い始めるときは、ここから外す（テストが落ちて教える）。
 * 逆に、サーバーでしか読まない名前空間を足したときは、ここに加えて
 * 辞書を軽く保つ。
 *
 * 残った辞書を言語レイアウト（`[locale]/layout.tsx`）から外してページごとに渡す分割は見送った。
 * LP の HTML を 42KB → 14KB にしても Lighthouse（Lantern）の LCP は変わらず
 * （2026-10 に `next start` で実測）、名前空間とページの対応を保つ手間に
 * 見合わない。
 */
export const SERVER_ONLY_MESSAGE_NAMESPACES = [
  // 用語集・規約・運営情報（サーバーで描く長文）
  "glossary",
  "privacy",
  "terms",
  "tokushoho",
  "legal",
  "company",
  "footer",
  "metadata",
  "aboutThisApp",
  "whyScoringIsComplex",
  "gettingStarted",
  "tryMentsuFu",
  // 教本の章の本文（確認問題の文言は `lessons` 側にあり、そちらはクライアントが引く）
  "tehaiFu",
  "ronToTsumo",
  "fuDoubling",
  "tsumoPayments",
  "oyaRonScores",
  "menzenMentsuScore",
  "pinfuScore",
  "furoScore",
  "chiitoitsuScore",
  "manganKoTsumo",
  "manganOyaTsumo",
  "manganOyaRon",
  "manganKoRon",
  "manganScoreTable",
  // サーバーコンポーネントだけが描く画面
  "examResult",
  "exp",
  "mypagePlan",
  "announcements",
  "publicProfile",
  "banned",
  "notFound",
  "nativeAd",
  "pagination",
  // アプリだけが使う名前空間（web は引かない）
  "mobilePlan",
] as const satisfies readonly MessageNamespace[];

/**
 * 管理画面（`/admin`）の配下だけに渡す名前空間
 *
 * 管理画面のクライアントコンポーネントは `admin.*` しか引かない。ユーザー向けの辞書に
 * 入れると全ページが運ぶので、`admin/layout.tsx`（管理画面だけのルートレイアウト）が
 * 自分の `NextIntlClientProvider` でこれだけを渡す。管理画面の配下ではこれが辞書の
 * 全部になる（ユーザー向けの言語レイアウトの辞書は管理画面に届かない）。
 */
export const ADMIN_MESSAGE_NAMESPACES = [
  "admin",
] as const satisfies readonly MessageNamespace[];

/** クライアントの辞書から外す名前空間（サーバー専用 + 管理画面専用） */
const NON_CLIENT_NAMESPACES: ReadonlySet<string> = new Set<string>([
  ...SERVER_ONLY_MESSAGE_NAMESPACES,
  ...ADMIN_MESSAGE_NAMESPACES,
]);

/**
 * 言語の辞書から、ユーザー向けのクライアントが引く名前空間だけを選ぶ
 * クライアント辞書選択
 *
 * `[locale]/layout.tsx` の `NextIntlClientProvider` に渡す。受け取るのは
 * リクエストの言語の辞書 1 つ（`loadMessages(locale)`）で、両方の言語の辞書を
 * 束ねて渡すことはしない。渡した辞書は全ページの HTML と遷移ごとの RSC 応答に
 * 載るので、英語を足しても日本語のページが運ぶ辞書は増えない（逆も同じ）。
 * サーバー専用・管理画面専用の名前空間を外す規則は言語によらず同じ。
 *
 * 英語の辞書は完訳の名前空間しか持たないので、結果も完訳の名前空間だけになる。
 * 足りない名前空間を日本語で埋めない（`loadMessages` の TSDoc）。
 *
 * 型は `Omit<...>` に絞らず、Provider が受け取る `Messages`（next-intl の辞書の型。
 * web は辞書の形を型に載せていないので任意の木）で返す。絞ったところで読む側
 * （`useTranslations` のキー）は辞書の型から検査されないため、得るものが無い。
 * `AbstractIntlMessages`（文字列と入れ子だけ）にしないのは、辞書に配列の値
 * （`mypage.heatmap.monthNames`。`t.raw` で読む）があり、その形に収まらないため
 * （収めるには型の断定が要る）。
 *
 * @param dictionary - リクエストの言語の辞書（`loadMessages` の戻り値）
 */
export function selectClientMessages(dictionary: MessagesForLocale): Messages {
  return Object.fromEntries(
    Object.entries(dictionary).filter(
      ([namespace]) => !NON_CLIENT_NAMESPACES.has(namespace),
    ),
  );
}

/**
 * 管理画面と共有するクライアントコンポーネント（`app/_components/`）が引く名前空間
 *
 * 管理画面の Provider はユーザー向けの辞書を引き継がないので、管理画面のシェルに置く共有部品
 * （`BrandLogo` の `nav`）の名前空間もここで渡し直す。ユーザー向けの辞書からは外さない
 * （ユーザー向けの画面でも同じ部品が引くため）。
 */
const ADMIN_SHARED_MESSAGE_NAMESPACES = [
  "nav",
] as const satisfies readonly MessageNamespace[];

/**
 * 管理画面の `NextIntlClientProvider` に渡す辞書
 *
 * 管理画面は日本語固定（英語の版を作らない）なので、言語を受け取らず日本語の
 * 辞書から選ぶ。
 */
export const adminClientMessages: Messages = Object.fromEntries(
  [...ADMIN_MESSAGE_NAMESPACES, ...ADMIN_SHARED_MESSAGE_NAMESPACES].map(
    (namespace) => [namespace, messages[namespace]],
  ),
);
