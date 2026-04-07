import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { isUserBanned } from "@/lib/ban";

/** 認証が必要なため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // BAN されたユーザーは BAN ページへリダイレクト
  if (await isUserBanned(user.id)) {
    redirect("/banned");
  }

  return <>{children}</>;
}
