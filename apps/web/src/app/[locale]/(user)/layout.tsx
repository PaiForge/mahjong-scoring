import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/app/[locale]/(user)/_components/header";
import { MobileTabBar } from "@/app/[locale]/(user)/_components/mobile-tab-bar";
import { Footer } from "@/app/[locale]/(user)/_components/footer";
import { isSupportedLocale } from "@mahjong-scoring/features/i18n/locales";

/**
 * ユーザー向け画面のシェル（ヘッダー・フッター・タブバー）
 *
 * @design 自分でロケールを確定させる
 * レイアウトはページや親のレイアウトと独立に評価されるので、言語レイアウトの
 * `setRequestLocale` を当てにしない。ヘッダー・フッターが翻訳を引く前に確定
 * させないと、next-intl が headers を読みに行き全ページが動的になる。ここでは
 * パスが決まらないので公開状態（`route-policy.ts`）は見ず、言語の検証だけを行う
 * （ページの公開可否は各 `page.tsx` の `prepareRouteLocale` が判定する）。
 */
export default async function UserLayout({
  children,
  params,
}: {
  readonly children: React.ReactNode;
  readonly params: Promise<{ readonly locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* 背景は敷かず、body の無地の下地（bg-secondary）をそのまま地にする。
          白い角丸カード（ContentContainer）がこの上に置かれる。
          最大幅・余白は ContentContainer 側が持つ。 */}
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      {/* 下端のスペーサーは MobileTabBar 自身が持つ（セッション中はタブバーごと消える）。 */}
      <MobileTabBar />
    </div>
  );
}
