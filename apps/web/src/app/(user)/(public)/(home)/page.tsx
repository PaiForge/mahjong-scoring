import { getOptionalUser } from "@/lib/auth";

import { LandingPage } from "./_components/landing-page";
import { HomeAnnouncements } from "./_components/home-announcements";

export default async function Home() {
  const user = await getOptionalUser();

  if (user) {
    return <HomeAnnouncements />;
  }

  return <LandingPage />;
}
