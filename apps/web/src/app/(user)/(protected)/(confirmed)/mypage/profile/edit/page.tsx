/**
 * プロフィール編集
 *
 * @description アバター・表示名・自己紹介・SNS アカウントを編集するページ。本登録（ユーザー名設定）直後にも誘導される（任意設定）。
 * @flow マイページ → プロフィール編集／setup-username 完了 → /mypage/profile/edit?from=setup
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import { getAuthenticatedUser } from "@/lib/auth";
import { getProfileForEdit } from "@/lib/db/queries";

import { AvatarUpload } from "./_components/avatar-upload";
import { ProfileForm } from "./_components/profile-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profileEdit");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const t = await getTranslations("profileEdit");
  const tMypage = await getTranslations("mypage");

  const user = await getAuthenticatedUser();
  const profile = await getProfileForEdit(user.id);

  const initial = {
    displayName: profile?.displayName ?? "",
    bio: profile?.bio ?? "",
    xUsername: profile?.xUsername ?? "",
    instagramUsername: profile?.instagramUsername ?? "",
    youtubeHandle: profile?.youtubeHandle ?? "",
  };

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <div className="flex justify-center">
          <AvatarUpload currentAvatarUrl={profile?.avatarUrl ?? null} />
        </div>

        <ProfileForm initial={initial} showSkip={from === "setup"} />
      </div>

      <div className="mt-10 border-t border-surface-200 pt-6 text-center">
        <Link
          href="/mypage/profile/edit/delete-account"
          className="text-sm text-surface-400 transition-colors hover:text-surface-600 hover:underline"
        >
          {t("deleteAccountLink")}
        </Link>
      </div>
    </ContentContainer>
  );
}
