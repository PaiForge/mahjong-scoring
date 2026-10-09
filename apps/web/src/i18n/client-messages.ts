import { messages } from "@mahjong-scoring/messages/ja";
import type { Messages } from "next-intl";

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
  // 教本の章の本文（確認問題の文言は `lessons` 側にあり、そちらはクライアントが引く）
  "tehaiFu",
  "ronToTsumo",
  "fuDoubling",
  "tsumoPayments",
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
  "mypageAccount",
  "announcements",
  "publicProfile",
  "banned",
  "notFound",
  "nativeAd",
  "pagination",
] as const satisfies readonly MessageNamespace[];

/**
 * 管理画面（`/admin`）の配下だけに渡す名前空間
 *
 * 管理画面のクライアントコンポーネントは `admin.*` しか引かない。ルートの辞書に
 * 入れるとユーザー向けの全ページが運ぶので、`admin/layout.tsx` が入れ子の
 * `NextIntlClientProvider` でこれだけを渡す（use-intl の Provider は `messages` を
 * 渡すと親の辞書を引き継がず置き換えるため、管理画面の配下ではこれが辞書の全部になる）。
 */
export const ADMIN_MESSAGE_NAMESPACES = [
  "admin",
] as const satisfies readonly MessageNamespace[];

/**
 * 辞書から名前空間を除いたものを返す
 *
 * 型は `Omit<typeof messages, ...>` に絞らず、Provider が受け取る `Messages`
 * のまま返す。`Object.fromEntries` の戻り値を Omit に絞るには型の断定が要り、
 * 絞ったところで読む側（`useTranslations` のキー）は辞書の型から検査されない
 * ため、得るものが無い。
 */
function omitNamespaces(excluded: ReadonlySet<string>): Messages {
  return Object.fromEntries(
    Object.entries(messages).filter(([namespace]) => !excluded.has(namespace)),
  );
}

/** ルートレイアウトの `NextIntlClientProvider` に渡す辞書（全ページのクライアントが引く分） */
export const clientMessages: Messages = omitNamespaces(
  new Set<string>([
    ...SERVER_ONLY_MESSAGE_NAMESPACES,
    ...ADMIN_MESSAGE_NAMESPACES,
  ]),
);

/**
 * 管理画面と共有するクライアントコンポーネント（`app/_components/`）が引く名前空間
 *
 * 管理画面の Provider は辞書を置き換えるので、管理画面のシェルに置く共有部品
 * （`BrandLogo` の `nav`）の名前空間もここで渡し直す。ルートの辞書からは外さない
 * （ユーザー向けの画面でも同じ部品が引くため）。
 */
const ADMIN_SHARED_MESSAGE_NAMESPACES = [
  "nav",
] as const satisfies readonly MessageNamespace[];

/** 管理画面の `NextIntlClientProvider` に渡す辞書 */
export const adminClientMessages: Messages = Object.fromEntries(
  [...ADMIN_MESSAGE_NAMESPACES, ...ADMIN_SHARED_MESSAGE_NAMESPACES].map(
    (namespace) => [namespace, messages[namespace]],
  ),
);
