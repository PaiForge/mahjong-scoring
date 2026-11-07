/**
 * プロフィール編集
 *
 * @description アバター・表示名・自己紹介・SNS アカウントを編集するページ。すべて任意。
 *   本登録（ユーザー名設定）の直後には挟まない — 登録直後はダッシュボードの
 *   「次にやること」へ着地させ、ここへはマイページから来る。
 * @flow マイページ → プロフィール編集 → 保存 → マイページ
 *
 * @design 英語でも出す
 * 他の利用者を見せる画面（公開プロフィール・ランキング）は英語で出さないが、
 * ここは本人が自分の入力を整える画面で、それに当たらない。英語のページでは
 * 見出し・ラベル・案内を英語で出し、保存後は同じ言語のマイページへ戻す。
 * 入力の中身（表示名・自己紹介）は本人の自由文で、言語を問わずそのまま出す。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import { getProfileForEdit } from "@/lib/db/queries";

import { AvatarUpload } from "../_components/avatar-upload";
import { ProfileForm } from "../_components/profile-form";
import { MypageSubpageLayout } from "../../../_components/mypage-subpage-layout";
import { prepareRouteLocale } from "@/i18n/route-locale";

import { confirmedGuardOptions } from "../../../../_lib/guard-options";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mypage/profile/edit">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/mypage/profile/edit");
  return createPrivateMetadata("profileEdit", "pageTitle", { locale });
}

export default async function ProfileEditPage({
  params,
}: PageProps<"/[locale]/mypage/profile/edit">) {
  const locale = await prepareRouteLocale(params, "/mypage/profile/edit");
  const t = await getTranslations("profileEdit");

  const { user } = await requireConfirmedUser(
    confirmedGuardOptions("/mypage/profile/edit", locale),
  );
  const profile = await getProfileForEdit(user.id);

  const initial = {
    displayName: profile?.displayName ?? "",
    bio: profile?.bio ?? "",
    xUsername: profile?.xUsername ?? "",
    instagramUsername: profile?.instagramUsername ?? "",
    youtubeHandle: profile?.youtubeHandle ?? "",
  };

  return (
    <MypageSubpageLayout title={t("pageTitle")}>
      <div className="space-y-8">
        <div className="flex justify-center">
          <AvatarUpload currentAvatarUrl={profile?.avatarUrl ?? null} />
        </div>

        <ProfileForm initial={initial} />
      </div>
    </MypageSubpageLayout>
  );
}
