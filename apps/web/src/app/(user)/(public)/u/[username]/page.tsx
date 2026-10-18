/**
 * 公開プロフィール
 *
 * @description ユーザー名で誰でも閲覧できる公開プロフィール。アバター・表示名・自己紹介・SNS リンクを表示する（SSR / SEO 対象）。退会・BAN・存在しないユーザーは 404。
 * 閲覧者がブロックした人は 404 にせず、ブロック中である旨と解除のボタンだけを出す（解除の入口を残すため）。
 * 通報とブロックはアバターの右上の「…」メニューに収める（`ProfileActionsMenu`）。ログインしていて他人のページのときだけ置く。
 * @flow マイページの「公開プロフィール」リンク・ランキングの行 → /u/[username] → 「…」→ ブロック → ブロック中の案内
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { buttonClasses } from "@/app/(user)/_components/_lib/button-classes";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { UserAvatar } from "@/app/(user)/_components/user-avatar";
import { createMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { isBlocking } from "@/lib/blocks/blocks";
import { getPublicProfileByUsername } from "@/lib/db/queries";

import { buildSnsLinks } from "@mahjong-scoring/features/public-profile/sns-links";

import { UnblockButton } from "./_components/block-dialogs";
import { ProfileActionsMenu } from "./_components/profile-actions-menu";

interface Props {
  readonly params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) {
    return { robots: { index: false, follow: false } };
  }

  const name = profile.displayName ?? profile.username;
  const t = await getTranslations("publicProfile");
  return createMetadata({
    title: name,
    description: profile.bio ?? t("metaDescription", { name }),
  });
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const t = await getTranslations("publicProfile");
  const viewer = await getOptionalUser();
  const isOwnProfile = viewer?.id === profile.id;
  const blocked = await isBlocking(viewer?.id, profile.id);

  if (blocked) {
    return (
      <ContentContainer>
        <PageTitle>{t("pageTitle")}</PageTitle>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm leading-relaxed text-surface-700">
            {t("blockedNotice", { username: profile.username })}
          </p>
          <UnblockButton
            username={profile.username}
            labels={{
              unblock: t("unblock"),
              unblockedToast: t("unblockedToast"),
              failedToast: t("unblockFailedToast"),
            }}
          />
        </div>
      </ContentContainer>
    );
  }

  const name = profile.displayName ?? profile.username;
  const snsLinks = buildSnsLinks({
    xUsername: profile.xUsername ?? undefined,
    instagramUsername: profile.instagramUsername ?? undefined,
    youtubeHandle: profile.youtubeHandle ?? undefined,
  });

  return (
    <ContentContainer>
      {/* PageTitle を直接の子にすることでタイトル帯へ引き上げ、白カードに w-full が付与される */}
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <div className="relative flex flex-col items-center gap-2 text-center">
          {viewer !== undefined && !isOwnProfile && (
            <div className="absolute right-0 top-0">
              <ProfileActionsMenu
                username={profile.username}
                labels={{
                  menu: t("moreActions"),
                  block: t("block"),
                  confirmTitle: t("blockConfirmTitle", {
                    username: profile.username,
                  }),
                  confirmMessage: t("blockConfirmMessage"),
                  confirm: t("blockConfirm"),
                  cancel: t("cancel"),
                  blockedToast: t("blockedToast"),
                  failedToast: t("blockFailedToast"),
                }}
              />
            </div>
          )}
          <UserAvatar avatarUrl={profile.avatarUrl} name={name} size="lg" />
          <div>
            {profile.displayName && (
              <p className="text-lg font-semibold text-surface-900">
                {profile.displayName}
              </p>
            )}
            <p className="text-sm text-surface-500">@{profile.username}</p>
          </div>
        </div>

        <section className="space-y-4">
          <SectionTitle>{t("bioTitle")}</SectionTitle>
          {profile.bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-700">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm text-surface-400">{t("bioEmpty")}</p>
          )}
        </section>

        {snsLinks.length > 0 && (
          <section className="space-y-4">
            <SectionTitle>{t("snsTitle")}</SectionTitle>
            <ul className="flex flex-wrap gap-3">
              {snsLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className={`${buttonClasses({ variant: "neutral", size: "sm" })} gap-1.5`}
                  >
                    <span className="font-medium">{link.label}</span>
                    <span className="text-surface-500">{link.handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </ContentContainer>
  );
}
