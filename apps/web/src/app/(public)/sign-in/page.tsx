import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { getOptionalUser } from "@/lib/auth";
import { GoogleOAuthButton } from "./_components/google-oauth-button";

/** 認証状態に依存するため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return createMetadata({ title: t("signInPageTitle") });
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getOptionalUser();

  if (user) {
    redirect("/mypage");
  }

  const { error } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <ContentContainer>
      <PageTitle>{t("signInPageTitle")}</PageTitle>
      <div className="mt-8 space-y-6">
        {error && (
          <p className="text-center text-sm text-red-600">{t("authError")}</p>
        )}
        <GoogleOAuthButton />
      </div>
    </ContentContainer>
  );
}
