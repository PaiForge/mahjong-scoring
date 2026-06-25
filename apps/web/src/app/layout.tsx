import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthProvider } from "@/app/_contexts/auth-context";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/app/_lib/metadata";
import "./globals.css";

const GlobalToaster = dynamic(() =>
  import("@/app/_components/global-toaster").then((mod) => mod.GlobalToaster),
);

export const metadata: Metadata = {
  title: `${SITE_NAME} - ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
};

export default async function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={locale}>
      <body className="min-h-screen overflow-x-hidden">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>{children}</AuthProvider>
          <GlobalToaster />
        </NextIntlClientProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
