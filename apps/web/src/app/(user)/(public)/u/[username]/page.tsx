/**
 * 公開プロフィール
 *
 * @description ユーザー名で誰でも閲覧できる公開プロフィール。アバター・表示名・自己紹介・SNS リンクを表示する（SSR / SEO 対象）。退会・BAN・存在しないユーザーは 404。
 * @flow マイページの「公開プロフィール」リンク等 → /u/[username]
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { UserAvatar } from "@/app/_components/user-avatar";
import { createMetadata } from "@/app/_lib/metadata";
import { getPublicProfileByUsername } from "@/lib/db/queries";

interface Props {
  readonly params: Promise<{ username: string }>;
}

/** 公開プロフィールに表示する SNS リンクを組み立てる */
function buildSnsLinks(profile: {
  xUsername: string | null;
  instagramUsername: string | null;
  youtubeHandle: string | null;
}) {
  const links: { label: string; handle: string; url: string }[] = [];
  if (profile.xUsername) {
    links.push({
      label: "X",
      handle: `@${profile.xUsername}`,
      url: `https://x.com/${profile.xUsername}`,
    });
  }
  if (profile.instagramUsername) {
    links.push({
      label: "Instagram",
      handle: `@${profile.instagramUsername}`,
      url: `https://www.instagram.com/${profile.instagramUsername}`,
    });
  }
  if (profile.youtubeHandle) {
    links.push({
      label: "YouTube",
      handle: `@${profile.youtubeHandle}`,
      url: `https://www.youtube.com/@${profile.youtubeHandle}`,
    });
  }
  return links;
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

  const name = profile.displayName ?? profile.username;
  const snsLinks = buildSnsLinks(profile);

  return (
    <ContentContainer>
      <div className="flex flex-col items-center gap-4 text-center">
        <UserAvatar avatarUrl={profile.avatarUrl} name={name} size="lg" />

        <div>
          <PageTitle>{name}</PageTitle>
          <p className="mt-1 text-sm text-surface-500">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-surface-700">
            {profile.bio}
          </p>
        )}

        {snsLinks.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-3">
            {snsLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-sm text-surface-700 transition-colors hover:bg-surface-100"
                >
                  <span className="font-medium">{link.label}</span>
                  <span className="text-surface-500">{link.handle}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ContentContainer>
  );
}
