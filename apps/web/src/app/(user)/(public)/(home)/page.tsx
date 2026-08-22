import { getOptionalUser } from "@/lib/auth";

import { HomeDashboard } from "./_components/home-dashboard";
import { LandingPage } from "./_components/landing-page";

export default async function Home() {
  const user = await getOptionalUser();

  if (user) {
    return <HomeDashboard />;
  }

  return <LandingPage />;
}
