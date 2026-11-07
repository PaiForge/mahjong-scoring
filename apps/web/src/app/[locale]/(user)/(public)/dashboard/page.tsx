import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createPrivateMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { localizedHref } from "@/i18n/public-path";

import { HomeDashboard } from "./_components/home-dashboard";
import { prepareRouteLocale } from "@/i18n/route-locale";

/**
 * ダッシュボード
 *
 * @description
 * ログイン済みユーザーのトップ。通常はこの URL に直接アクセスするのではなく、
 * ログイン済みユーザーの「/」を proxy.ts がここへ rewrite して表示する
 * （アドレスバーは「/」のまま）。「/」自身を cookie を読まない静的な LP に
 * 保つための分割（詳細は `(home)/page.tsx` の TSDoc 参照）。英語も同じで、
 * ログイン済みの「/en」を proxy が英語の「/en/dashboard」へ rewrite する
 * （アドレスバーは「/en」のまま）。日本語と同じ体験を英語でも出すため。
 *
 * 言語はページの入口（`prepareRouteLocale`）で確定させ、metadata と下の部品
 * （リンク先の言語・お知らせの言語）へ明示で渡す。英語でもダッシュボードは
 * 機能画面なので索引させない（`createPrivateMetadata` の noindex を言語付きで。
 * 公開状態は `published-noindex`）。cookie を読むので動的のまま。
 *
 * ガードは `getOptionalUser()` のみ（分割前の「/」と同じ条件）。
 * プロフィール未作成・BAN のユーザーにも表示するため、(protected) 系の
 * requireConfirmedUser は使わない。未ログインの直アクセスは proxy が
 * その言語のトップ（「/」・「/en」）へ redirect するが、proxy を経由しない
 * 経路に備えてページ側でも弾く。行き先は今の言語のトップ
 * （`localizedHref("/", locale)`。英語のページから日本語の LP へ落とさない）。
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/dashboard");
  return createPrivateMetadata("nav", "home", { locale });
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const locale = await prepareRouteLocale(params, "/dashboard");
  const user = await getOptionalUser();
  if (!user) {
    redirect(localizedHref("/", locale));
  }

  return <HomeDashboard userId={user.id} locale={locale} />;
}
