import type { Metadata } from "next";

import {
  buildSocialCard,
  DEFAULT_TITLE,
  SITE_DESCRIPTION,
} from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";

import { HomeDashboard } from "./_components/home-dashboard";
import { LandingPage } from "./_components/landing-page";

/**
 * タイトルと説明はルートレイアウトから継承する。ここで持つのは canonical と
 * og:url 入りのカード（レイアウト側のカードは og:url を持たないため、
 * トップページの URL はここで名乗る）。
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  ...buildSocialCard({
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    path: "/",
  }),
};

export default async function Home() {
  const user = await getOptionalUser();

  if (user) {
    return <HomeDashboard />;
  }

  return <LandingPage />;
}
