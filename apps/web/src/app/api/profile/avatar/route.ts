import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import sharp from "sharp";

import { logActivityEvent } from "@/lib/activity-log";
import { LEADERBOARD_CACHE_TAG } from "@/lib/cache-tags";
import { authorizeApiRequest } from "@/lib/api-auth";
import { db, profiles } from "@/lib/db";
import { validateImageBinarySignature } from "@/lib/images/binary-signature";
import {
  AVATAR_MAX_FILE_SIZE,
  isAllowedImageMimeType,
} from "@/lib/images/policy";
import { SHARP_DECODE_OPTIONS } from "@/lib/images/sharp-options";

/**
 * アバター画像のアップロード（POST）・削除（DELETE）エンドポイント。
 *
 * POST は受け取った画像を検証し、Sharp で EXIF を除去して 256x256 の WebP に正規化した
 * うえで `avatars/${userId}/avatar.webp` に保存し、`profiles.avatar_url` を更新する。
 * DELETE は同じパスのオブジェクトを消して `profiles.avatar_url` を NULL に戻す。
 * Storage への書き込み・削除は認証ユーザーのクライアント経由で行い、
 * RLS（自分のフォルダのみ）で保護する。
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
  const { user, supabase } = auth;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    // 壊れた multipart を 500 にしない（送信側の誤りなので 400）
    return NextResponse.json({ error: "invalidForm" }, { status: 400 });
  }
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "noFile" }, { status: 400 });
  }

  if (!isAllowedImageMimeType(file.type)) {
    return NextResponse.json({ error: "invalidType" }, { status: 400 });
  }

  if (file.size > AVATAR_MAX_FILE_SIZE) {
    return NextResponse.json({ error: "tooLarge" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();

  // 拡張子・Content-Type 偽装対策にバイナリ先頭を検証する。
  if (!validateImageBinarySignature(arrayBuffer, file.type)) {
    return NextResponse.json({ error: "invalidType" }, { status: 400 });
  }

  // バイト数の上限を通っても、巨大寸法（圧縮爆弾）やアニメーションの多フレームは
  // デコード時に膨れ上がる。面積とフレーム数の上限は SHARP_DECODE_OPTIONS が持つ。
  let processed: Buffer;
  try {
    processed = await sharp(Buffer.from(arrayBuffer), SHARP_DECODE_OPTIONS)
      .rotate() // EXIF の回転を焼き込み、その他メタデータ（GPS等）は破棄
      .resize(AVATAR_PIXEL_SIZE, AVATAR_PIXEL_SIZE, { fit: "cover" })
      .webp({ quality: AVATAR_WEBP_QUALITY })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "invalidImage" }, { status: 400 });
  }

  const filePath = avatarFilePath(user.id);

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

  // ランキングのキャッシュ（5 分）は行にアバター URL を含むため、ここで捨てないと
  // 一覧だけ古い画像を出し続ける。URL 末尾の ?t= は新しい URL が配られて初めて効く。
  // キャッシュのキーは (種目・期間・ページ) 単位でユーザー単位ではないので、
  // 一部だけを狙って捨てることはできない。アバター変更の頻度なら全体で購う。
  revalidateTag(LEADERBOARD_CACHE_TAG, "default");

  logActivityEvent({
    userId: user.id,
    action: "update_avatar",
    targetType: "user",
    targetId: user.id,
  });

  return NextResponse.json({ success: true, avatarUrl });
}

export async function DELETE(request: Request) {
  const auth = await authorizeApiRequest(request, "deleteAvatar");
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  // 先に参照（profiles.avatar_url）を切る。Storage の削除に失敗しても残るのは
  // 誰からも参照されないオブジェクトだけで、次のアップロードが同じパスを上書きする。
  // 逆順にすると失敗時に「消えた画像を指す URL」が残り、一覧が壊れた画像を出す。
  await db
    .update(profiles)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  // アップロードと同じ理由でランキングのキャッシュを捨てる（行にアバター URL を含む）。
  revalidateTag(LEADERBOARD_CACHE_TAG, "default");

  // Storage の削除は失敗しても操作全体を失敗させない（上のコメントの通り無害なため）。
  await supabase.storage.from("avatars").remove([avatarFilePath(user.id)]);

  logActivityEvent({
    userId: user.id,
    action: "delete_avatar",
    targetType: "user",
    targetId: user.id,
  });

  return NextResponse.json({ success: true });
}
