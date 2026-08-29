import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createPrivateMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";

import { HomeDashboard } from "./_components/home-dashboard";

/**
 * ダッシュボード
 *
 * @description
 * ログイン済みユーザーのトップ。通常はこの URL に直接アクセスするのではなく、
 * ログイン済みユーザーの「/」を proxy.ts がここへ rewrite して表示する
 * （アドレスバーは「/」のまま）。「/」自身を cookie を読まない静的な LP に
 * 保つための分割（詳細は `(home)/page.tsx` の TSDoc 参照）。
 *
 * ガードは `getOptionalUser()` のみ（分割前の「/」と同じ条件）。
 * プロフィール未作成・BAN のユーザーにも表示するため、(protected) 系の
 * requireConfirmedUser は使わない。未ログインの直アクセスは proxy が
 * 「/」へ redirect するが、proxy を経由しない経路に備えてページ側でも弾く。
 */
export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("nav", "home");
}

export default async function DashboardPage() {
  const user = await getOptionalUser();
  if (!user) {
    redirect("/");
  }

  return <HomeDashboard />;
}
