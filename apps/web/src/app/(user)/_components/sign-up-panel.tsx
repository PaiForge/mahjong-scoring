import Link from "next/link";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { SUB_LINK_GAP } from "@/app/_components/_lib/spacing";

import { LinkButton } from "./link-button";

interface SignUpPanelProps {
  readonly title: string;
  readonly description: string;
  /** 登録ボタンの文言 */
  readonly cta: string;
  /**
   * 登録しない人の逃げ道（「登録せずに練習一覧を見る」等）。ボタンの下に
   * テキストリンクで添える。無ければボタンだけ
   */
  readonly secondary?: { readonly label: string; readonly href: string };
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
 * 文言は翻訳済みの文字列で受ける。
 */
export function SignUpPanel({
  title,
  description,
  cta,
  secondary,
}: SignUpPanelProps) {
  return (
    <section className="space-y-4 rounded-panel border border-panel bg-surface-50 px-6 py-8 text-center">
      <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
      <p className="mx-auto max-w-xl text-sm leading-relaxed text-surface-500">
        {description}
      </p>
      <div className={`flex flex-col items-center ${SUB_LINK_GAP}`}>
        <LinkButton href="/sign-up" size="lg">
          {cta}
        </LinkButton>
        {secondary ? (
          <Link
            href={secondary.href}
            className={`text-sm ${TEXT_LINK_CLASSES}`}
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
