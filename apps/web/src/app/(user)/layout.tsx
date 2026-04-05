import { Sidebar } from "@/app/_components/sidebar";
import { MobileHeader } from "@/app/_components/mobile-header";
import { MobileTabBar } from "@/app/_components/mobile-tab-bar";
import { Footer } from "@/app/_components/footer";

export default function UserLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <MobileHeader />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen bg-white">{children}</main>
      <Footer />
      <MobileTabBar />
    </>
  );
}
