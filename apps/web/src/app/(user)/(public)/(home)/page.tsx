import type { Metadata } from "next";

import { getOptionalUser } from "@/lib/auth";

import { HomeDashboard } from "./_components/home-dashboard";
import { LandingPage } from "./_components/landing-page";

/**
 * タイトルと説明はルートレイアウトから継承する。ここで指定するのは
 * canonical だけ（未ログイン時の LP が最重要ページのため必ず持たせる）。
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const user = await getOptionalUser();

  if (user) {
    return <HomeDashboard />;
  }

  return <LandingPage />;
}
