import { Header } from "@/app/_components/header";
import { MobileTabBar } from "@/app/_components/mobile-tab-bar";
import { Footer } from "@/app/_components/footer";

export default function UserLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-card">
        {/* 背景は白。PageTitle 部分のみ ContentContainer が全幅グレー帯を描画する。 */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-4 pb-0 sm:pb-8">
          {children}
        </div>
      </main>
      <Footer />
      {/* 固定の MobileTabBar がフッターを覆わないようにするスペーサー */}
      <div className="h-14 md:h-0" />
      <MobileTabBar />
    </div>
  );
}
