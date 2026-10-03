/**
 * プロフィール編集
 *
 * @description アバター・表示名・自己紹介・SNS アカウントを編集するページ。すべて任意。
 *   本登録（ユーザー名設定）の直後には挟まない — 登録直後はダッシュボードの
 *   「次の一歩」へ着地させ、ここへはマイページから来る。
 * @flow マイページ → プロフィール編集 → 保存 → マイページ
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import { getProfileForEdit } from "@/lib/db/queries";

import { AvatarUpload } from "../_components/avatar-upload";
import { ProfileForm } from "../_components/profile-form";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("profileEdit");
}

export default async function ProfileEditPage() {
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

        <ProfileForm initial={initial} />
      </div>
    </ContentContainer>
  );
}
