import { PageSkeleton } from "@/app/_components/page-skeleton";

/**
 * (user) シェル配下の汎用フォールバックローディング。
 *
 * 認証ガードは各ページの requireConfirmedUser() / requireProvisionalUser() に
 * 移したため、保護領域のレイアウトは await しない。よって専用 loading.tsx を
 * 持つページ（例: mypage/(home), profile/edit）はリロード時でも自前スケルトンを
 * 表示する。ここはそれらを持たないページの汎用フォールバックとして機能する。
 * 公開ルートは近接する (public)/loading.tsx が優先されるため影響しない。
 * ローディング
 */
export default function UserLoading() {
  return <PageSkeleton />;
}
