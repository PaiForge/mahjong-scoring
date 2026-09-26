-- avatars バケットと Storage RLS ポリシー。
-- migrate.ts が Supabase 環境でのみ適用する（冪等：再実行可能）。
--
-- パス構成は `${auth.uid()}/avatar.webp`。
-- 書き込みはサーバ（サービスロール）のみ、読み取りは公開（public バケット）。

-- バケット作成（既存なら設定を更新）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MiB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 書き込み系（INSERT / UPDATE / DELETE）のポリシーは置かない。書き込みは
-- /api/profile/avatar がサービスロールで行う（RLS を迂回する）。
--
-- 以前は自分の uid フォルダへの書き込みを認証ユーザーに許していたが、それだと
-- anon キーと自分のトークンで Storage API を直接叩き、API の検証と WebP への
-- 正規化を通らない任意のバイト列（allowed_mime_types は宣言された Content-Type
-- しか見ない）を公開バケットに置けた。そのオブジェクトは next.config の
-- remotePatterns で許可されており、/_next/image が取得してデコードする。
-- 下の DROP は既存環境から旧ポリシーを取り除くために残す（冪等）。
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;

-- SELECT: 公開バケットなので誰でも読み取り可
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- =============================================================================
-- ad-creatives バケット（ネイティブ広告の画像）
-- =============================================================================
-- パス構成は `<ランダムな uuid>.webp`。書き込みは /api/admin/ads/image が
-- 管理者を確認したうえでサービスロールで行い、WebP に正規化する（avatars と
-- 同じ理由で、クライアントに書き込みポリシーは与えない）。読み取りは公開。
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-creatives',
  'ad-creatives',
  true,
  5242880, -- 5MiB
  ARRAY['image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "ad_creatives_select_public" ON storage.objects;
CREATE POLICY "ad_creatives_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ad-creatives');
