import { eq } from "drizzle-orm";
import sharp from "sharp";

import { logActivityEvent } from "@/lib/activity-log";
import { purgeLeaderboardCache } from "@/lib/cache-tags";
import { authorizeApiRequest } from "@/lib/api-auth";
import { jsonPrivate } from "@/lib/api-response";
import { logExternalError } from "@/lib/log-error";
import { db, profiles } from "@/lib/db";
import { writeAsAccount } from "@/lib/users/account-write-lock";
import { readUploadedImage } from "@/lib/images/read-uploaded-image";
import { SHARP_DECODE_OPTIONS } from "@/lib/images/sharp-options";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * アバター画像のアップロード（POST）・削除（DELETE）エンドポイント。
 *
 * POST は受け取った画像を検証し、Sharp で EXIF を除去して 256x256 の WebP に正規化した
 * うえで `avatars/${userId}/avatar.webp` に保存し、`profiles.avatar_url` を更新する。
 * DELETE は同じパスのオブジェクトを消して `profiles.avatar_url` を NULL に戻す。
 * Storage への書き込み・削除はサービスロールのクライアントで行う。avatars バケットは
 * 認証ユーザーに書き込みポリシーを与えていない（`drizzle/supabase/storage_setup.sql`）。
 * ユーザーのクライアントで書ける設計にすると、この API の検証と WebP への正規化を
 * 通らない任意のバイト列を公開バケットに置けてしまい、それが remotePatterns で
 * 許可された `/_next/image` の入力になる（画像デコーダの脆弱性への入口になる）。
 *
 * アバターアップロードAPI
 */

const AVATAR_PIXEL_SIZE = 256;
const AVATAR_WEBP_QUALITY = 85;
const AVATAR_PATH_SUFFIX = "avatar.webp";

/** Storage 上のアバターのパス。ユーザーごとに 1 枚で、上書き運用のため常に同じ。 */
function avatarFilePath(userId: string): string {
  return `${userId}/${AVATAR_PATH_SUFFIX}`;
}

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request, "uploadAvatar");
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const image = await readUploadedImage(request);
  if (!image.ok) return image.response;

  // バイト数の上限を通っても、巨大寸法（圧縮爆弾）やアニメーションの多フレームは
  // デコード時に膨れ上がる。面積とフレーム数の上限は SHARP_DECODE_OPTIONS が持つ。
  let processed: Buffer;
  try {
    processed = await sharp(image.buffer, SHARP_DECODE_OPTIONS)
      .rotate() // EXIF の回転を焼き込み、その他メタデータ（GPS等）は破棄
      .resize(AVATAR_PIXEL_SIZE, AVATAR_PIXEL_SIZE, { fit: "cover" })
      .webp({ quality: AVATAR_WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    logExternalError("POST /api/profile/avatar", "画像の変換に失敗", error);
    return jsonPrivate({ error: "invalidImage" }, { status: 400 });
  }

  const filePath = avatarFilePath(user.id);
  const { storage } = createAdminClient();

  const { error: uploadError } = await storage
    .from("avatars")
    .upload(filePath, processed, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    return jsonPrivate({ error: "uploadFailed" }, { status: 500 });
  }

  // 同一パスを上書きするため URL は不変。キャッシュバストにタイムスタンプを付与する。
  const {
    data: { publicUrl },
  } = storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  // 退会を受け付けた後なら URL を書かず、上げた画像も消す（退会の Storage の
  // 工程が先に済んでいると、ここで上げた画像は誰にも消されずに残る）
  const { written } = await writeAsAccount(user.id, (tx) =>
    tx
      .update(profiles)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(profiles.id, user.id)),
  );
  if (!written) {
    await storage.from("avatars").remove([filePath]);
    return jsonPrivate({ error: "unauthorized" }, { status: 401 });
  }

  // ランキングのキャッシュ（5 分）は行にアバター URL を含むため、ここで捨てないと
  // 一覧だけ古い画像を出し続ける。URL 末尾の ?t= は新しい URL が配られて初めて効く。
  // キャッシュのキーは (種目・期間・ページ) 単位でユーザー単位ではないので、
  // 一部だけを狙って捨てることはできない。アバター変更の頻度なら全体で購う。
  purgeLeaderboardCache();

  logActivityEvent({
    userId: user.id,
    action: "update_avatar",
    targetType: "user",
    targetId: user.id,
  });

  return jsonPrivate({ success: true, avatarUrl });
}

export async function DELETE(request: Request) {
  const auth = await authorizeApiRequest(request, "deleteAvatar");
  if (!auth.ok) return auth.response;
  const { user } = auth;

  // 先に参照（profiles.avatar_url）を切る。Storage の削除に失敗しても残るのは
  // 誰からも参照されないオブジェクトだけで、次のアップロードが同じパスを上書きする。
  // 逆順にすると失敗時に「消えた画像を指す URL」が残り、一覧が壊れた画像を出す。
  await db
    .update(profiles)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  // アップロードと同じ理由でランキングのキャッシュを捨てる（行にアバター URL を含む）。
  purgeLeaderboardCache();

  // Storage の削除は失敗しても操作全体を失敗させない（上のコメントの通り無害なため）。
  await createAdminClient()
    .storage.from("avatars")
    .remove([avatarFilePath(user.id)]);

  logActivityEvent({
    userId: user.id,
    action: "delete_avatar",
    targetType: "user",
    targetId: user.id,
  });

  return jsonPrivate({ success: true });
}
