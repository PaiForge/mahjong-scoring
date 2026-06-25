import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { logActivityEvent } from "@/lib/activity-log";
import { getClientIp } from "@/lib/client-ip";
import { db, profiles } from "@/lib/db";
import { validateImageBinarySignature } from "@/lib/image-signature";
import { IP_RATE_LIMITS, checkIpRateLimitGuard } from "@/lib/rate-limit-ip";
import { createClient } from "@/lib/supabase/server";

/**
 * アバター画像アップロードエンドポイント。
 *
 * 受け取った画像を検証し、Sharp で EXIF を除去して 256x256 の WebP に正規化したうえで
 * `avatars/${userId}/avatar.webp` に保存し、`profiles.avatar_url` を更新する。
 * Storage への書き込みは認証ユーザーのクライアント経由で行い、RLS（自分のフォルダのみ）で保護する。
 *
 * アバターアップロードAPI
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MiB（バケット上限と一致）
const AVATAR_PIXEL_SIZE = 256;
const AVATAR_WEBP_QUALITY = 85;
const AVATAR_PATH_SUFFIX = "avatar.webp";

export async function POST(request: Request) {
  const ipRateLimited = checkIpRateLimitGuard(
    await getClientIp(),
    "uploadAvatar",
    IP_RATE_LIMITS.uploadAvatar,
  );
  if (ipRateLimited) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "noFile" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "invalidType" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "tooLarge" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();

  // 拡張子・Content-Type 偽装対策にバイナリ先頭を検証する。
  if (!validateImageBinarySignature(arrayBuffer, file.type)) {
    return NextResponse.json({ error: "invalidType" }, { status: 400 });
  }

  let processed: Buffer;
  try {
    processed = await sharp(Buffer.from(arrayBuffer), { failOn: "error" })
      .rotate() // EXIF の回転を焼き込み、その他メタデータ（GPS等）は破棄
      .resize(AVATAR_PIXEL_SIZE, AVATAR_PIXEL_SIZE, { fit: "cover" })
      .webp({ quality: AVATAR_WEBP_QUALITY })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "invalidImage" }, { status: 400 });
  }

  const filePath = `${user.id}/${AVATAR_PATH_SUFFIX}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, processed, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "uploadFailed" }, { status: 500 });
  }

  // 同一パスを上書きするため URL は不変。キャッシュバストにタイムスタンプを付与する。
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  await db
    .update(profiles)
    .set({ avatarUrl, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  logActivityEvent({
    userId: user.id,
    action: "update_avatar",
    targetType: "user",
    targetId: user.id,
  });

  return NextResponse.json({ success: true, avatarUrl });
}
