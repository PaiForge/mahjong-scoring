import { Header } from "@/app/(user)/_components/header";
import { MobileTabBar } from "@/app/(user)/_components/mobile-tab-bar";
import { Footer } from "@/app/(user)/_components/footer";

export default function UserLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* 背景は敷かず、body の下地（bg-secondary + 斜線）をそのまま地にする。
          白い角丸カード（ContentContainer）がこの上に浮く。
          最大幅・余白は ContentContainer 側が持つ。 */}
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
      {/* 下端のスペーサーは MobileTabBar 自身が持つ（セッション中はタブバーごと消える）。 */}
      <MobileTabBar />
    </div>
  );
}
