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
      {/* 背景は白の全幅。最大幅・余白・PageTitle のグレー帯は ContentContainer 側が持つ。 */}
      <main className="flex-1 bg-card">{children}</main>
      <Footer />
      {/* 固定の MobileTabBar がフッターを覆わないようにするスペーサー */}
      <div className="h-14 md:h-0" />
      <MobileTabBar />
    </div>
  );
}
