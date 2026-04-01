import { getAuthenticatedUser } from "@/lib/auth";

/** 認証が必要なため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  await getAuthenticatedUser();

  return <>{children}</>;
}
