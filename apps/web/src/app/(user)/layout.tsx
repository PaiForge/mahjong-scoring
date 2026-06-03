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
      {/* 背景はグレーの全幅（blindfold-chess 準拠）。白い角丸カード（ContentContainer）が
          この上に浮く。最大幅・余白は ContentContainer 側が持つ。 */}
      <main className="flex-1 bg-secondary">{children}</main>
      <Footer />
      {/* 固定の MobileTabBar がフッターを覆わないようにするスペーサー */}
      <div className="h-14 md:h-0" />
      <MobileTabBar />
    </div>
  );
}
