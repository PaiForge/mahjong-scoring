import { LandingPage } from "@/components/landing-page";
import { Dashboard } from "@/components/dashboard";

// TODO: Replace with actual auth check
function getUser(): { id: string } | undefined {
  return undefined;
}

export default function Home() {
  const user = getUser();

  if (user) {
    return <Dashboard />;
  }

  return <LandingPage />;
}
