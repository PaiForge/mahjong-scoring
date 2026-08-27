/**
 * プロフィール編集
 *
 * @description アバター・表示名・自己紹介・SNS アカウントを編集するページ。本登録（ユーザー名設定）直後にも誘導される（任意設定）。
 * @flow マイページ → プロフィール編集／setup-username 完了 → /mypage/profile/edit?from=setup
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import { getProfileForEdit } from "@/lib/db/queries";

import { AvatarUpload } from "../_components/avatar-upload";
import { ProfileForm } from "../_components/profile-form";
import { TEXT_LINK_MUTED_CLASSES } from "@/app/_components/_lib/link-classes";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("profileEdit");
}

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const t = await getTranslations("profileEdit");
  const tMypage = await getTranslations("mypage");

  const { user } = await requireConfirmedUser();
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

      <div className="mt-10 border-t-2 border-dashed border-border/40 pt-6 text-center">
        <Link
          href="/mypage/account/delete"
          className={`text-sm ${TEXT_LINK_MUTED_CLASSES}`}
        >
          {t("deleteAccountLink")}
        </Link>
      </div>
    </ContentContainer>
  );
}
