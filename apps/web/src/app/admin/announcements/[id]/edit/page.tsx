import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { announcements, db } from "@/lib/db";

import { AnnouncementForm } from "../../_components/announcement-form";
import { DeleteAnnouncementButton } from "../../_components/delete-announcement-button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAnnouncementPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("admin.announcements");

  const [announcement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!announcement) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <AdminPageTitle>{t("editTitle")}</AdminPageTitle>
        <DeleteAnnouncementButton announcementId={announcement.id} />
      </div>
      <AnnouncementForm
        mode="edit"
        announcementId={announcement.id}
        defaultValues={{
          slug: announcement.slug,
          title: announcement.title,
          content: announcement.content,
          locale: announcement.locale,
          status: announcement.status ?? "draft",
          publishedAt: announcement.publishedAt
            ? announcement.publishedAt.toISOString()
            : null,
          pinned: announcement.pinnedAt !== null,
        }}
        lockSlug
      />
    </div>
  );
}
