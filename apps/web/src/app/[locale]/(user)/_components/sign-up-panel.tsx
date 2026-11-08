import Link from "next/link";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";

import type { NavTarget } from "./_lib/locale-links";
import { LinkButton } from "./link-button";
import { JapaneseOnlyMark, LocaleNavLink } from "./locale-nav-link";

/** 登録ページ（ロケール非依存の href） */
const SIGN_UP_PATH = "/sign-up";

/**
 * 登録しない人の逃げ道のリンク
 *
 * `href` はロケール非依存の href を `next/link` で張る（日本語のページの従来の形）。
 * 英語のページに置くときは `navTarget`（`resolveNavTargetFor()` の結果）で受け、
 * 言語をまたぐなら素の `<a hrefLang="ja">` と「日本語のみ」の印で描く。
 */
type SignUpPanelSecondary =
  | {
      readonly label: string;
      readonly href: string;
      readonly navTarget?: undefined;
    }
  | {
      readonly label: string;
      readonly navTarget: NavTarget;
      readonly href?: undefined;
    };

interface SignUpPanelProps {
  readonly title: string;
  readonly description: string;
  /** 登録ボタンの文言 */
  readonly cta: string;
  /**
   * 登録ボタンの張る先（`resolveNavTargetFor("/sign-up", locale)` の結果）。
   * 省略時は `/sign-up` へ `next/link` で張る（日本語のページの従来の形。
   * 呼び出し元を書き換えずに済むよう省略可能にしてある）
   */
  readonly navTarget?: NavTarget;
  /**
   * 登録しない人の逃げ道（「登録せずに練習一覧を見る」等）。ボタンの下に
   * テキストリンクで添える。無ければボタンだけ
   */
  readonly secondary?: SignUpPanelSecondary;
}

/**
 * アカウント登録へ誘導する囲み
 * 登録誘導パネル
 *
 * 見出し・一文・「無料ユーザー登録」ボタンの 3 段。はじめ方ガイドの末尾と
 * 体験ページの答え合わせの下で同じ姿を使う。登録は「押して始める面」なので
 * ボタンは primary のまま、添えるリンクはグレー下線（移動するだけ）。
 * ボタンと添えるリンクの間隔は {@link SUB_LINK_GAP}。
 *
 * サーバーコンポーネントからもクライアントコンポーネントからも置けるよう、
 * 文言は翻訳済みの文字列で、張る先は解決済みの {@link NavTarget} で受ける
 * （公開状態の判定 `resolveNavTargetFor` はサーバー専用のため）。
 *
 * @design 登録ページが今の言語で未公開なら、印付きで日本語の登録へ送る
 * 英語のページでは登録ページ（`/sign-up`）がまだ英語で公開されていない。
 * それでもボタンを消さず、`navTarget` の `crossLocale` を見て素の
 * `<a hrefLang="ja">`（文書ごと読み込む）にし、ボタンの中に「日本語のみ」の印
 * （{@link JapaneseOnlyMark}）を置く。登録は言語をまたいでも成立するため、
 * 読むだけのリンクと同じく印付きで出す（練習カードのような「押して始める面」を
 * 未公開なら消す規則の例外）。英語の登録ページが公開されれば、`navTarget` が
 * 同じ言語の href を返すだけで印は消える（言語の分岐を持たない）。
 */
export function SignUpPanel({
  title,
  description,
  cta,
  navTarget,
  secondary,
}: SignUpPanelProps) {
  return (
    <section className="space-y-4 rounded-panel border border-panel bg-surface-50 px-6 py-8 text-center">
      <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-surface-500">
        {description}
      </p>
      <div className={`flex flex-col items-center ${SUB_LINK_GAP}`}>
        {navTarget === undefined ? (
          <LinkButton href={SIGN_UP_PATH} size="lg">
            {cta}
          </LinkButton>
        ) : (
          <LinkButton navTarget={navTarget} size="lg">
            {cta}
            {navTarget.crossLocale && <CrossLocaleMark />}
          </LinkButton>
        )}
        {secondary ? <SecondaryLink secondary={secondary} /> : null}
      </div>
    </section>
  );
}

/** 登録しない人の逃げ道のリンク（{@link SignUpPanelSecondary}） */
function SecondaryLink({
  secondary,
}: {
  readonly secondary: SignUpPanelSecondary;
}) {
  const className = `text-sm ${TEXT_LINK_CLASSES}`;
  if (secondary.navTarget === undefined) {
    return (
      <Link href={secondary.href} className={className}>
        {secondary.label}
      </Link>
    );
  }
  return (
    <LocaleNavLink
      navTarget={secondary.navTarget}
      linkKind="plain"
      className={className}
    >
      {secondary.label}
      {secondary.navTarget.crossLocale && <CrossLocaleMark />}
    </LocaleNavLink>
  );
}

/**
 * 言語をまたぐリンクに添える「日本語のみ」の印
 *
 * 文言を引くフックは、言語をまたぐときにだけ描くこの子に閉じ込める。
 * 日本語のページの従来の呼び出し（`navTarget` を渡さない）では辞書を読まない。
 */
function CrossLocaleMark() {
  const tNav = useTranslations("nav");
  return <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />;
}
