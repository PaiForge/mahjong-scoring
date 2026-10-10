import "server-only";

import { eq } from "drizzle-orm";
import sharp from "sharp";

import { logActivityEvent } from "@/lib/activity-log";
import { purgeLeaderboardCache } from "@/lib/cache-tags";
import { db, profiles } from "@/lib/db";
import { SHARP_DECODE_OPTIONS } from "@/lib/images/sharp-options";
import { logExternalError } from "@/lib/log-error";
import { createAdminClient } from "@/lib/supabase/admin";

import { writeAsAccount } from "./account-write-lock";

/*
 * アバター画像の保存と削除（web の /api/profile/avatar とアプリ向け API の本体）
 *
 * 画像は検証してから Sharp で EXIF を除去して 256x256 の WebP に正規化した
 * うえで `avatars/${userId}/avatar.webp` に保存し、`profiles.avatar_url` を更新する。
 * 削除は同じパスのオブジェクトを消して `profiles.avatar_url` を NULL に戻す。
 * Storage への書き込み・削除はサービスロールのクライアントで行う。avatars バケットは
 * 認証ユーザーに書き込みポリシーを与えていない（`drizzle/supabase/storage_setup.sql`）。
 * ユーザーのクライアントで書ける設計にすると、この検証と WebP への正規化を
 * 通らない任意のバイト列を公開バケットに置けてしまい、それが remotePatterns で
 * 許可された `/_next/image` の入力になる（画像デコーダの脆弱性への入口になる）。
 */

const AVATAR_PIXEL_SIZE = 256;
const AVATAR_WEBP_QUALITY = 85;
const AVATAR_PATH_SUFFIX = "avatar.webp";

/** Storage 上のアバターのパス。ユーザーごとに 1 枚で、上書き運用のため常に同じ。 */
function avatarFilePath(userId: string): string {
  return `${userId}/${AVATAR_PATH_SUFFIX}`;
}

/**
 * アバターの保存の失敗理由
 *
 * - `invalidImage` — デコードできない（送信側の誤り）
 * - `uploadFailed` — Storage への保存に失敗した
 * - `unauthorized` — 入口の確認を通った後に退会が受け付けられた
 */
export type AvatarSaveError = "invalidImage" | "uploadFailed" | "unauthorized";

/**
 * アバター画像を正規化して保存し、プロフィールの URL を差し替える
 * アバター保存
 *
 * web の Route Handler とアプリ向け API の両方から呼ぶ。認証・回数制限・
 * 受け付ける形式とサイズの検証（`readUploadedImageFile`）は呼び出し側が済ませること。
 *
 * @param userId - 認証済みユーザーの ID
 * @param image - 検証済みの画像のバイト列
 * @param where - 失敗の記録に付ける呼び出し元（`POST /api/...`）
 * @returns 保存した画像の URL（キャッシュバスト付き）
 */
export async function saveAvatarForUser(
  userId: string,
  image: Buffer,
  where: string,
): Promise<
  { readonly avatarUrl: string } | { readonly error: AvatarSaveError }
> {
  // バイト数の上限を通っても、巨大寸法（圧縮爆弾）やアニメーションの多フレームは
  // デコード時に膨れ上がる。面積とフレーム数の上限は SHARP_DECODE_OPTIONS が持つ。
  let processed: Buffer;
  try {
    processed = await sharp(image, SHARP_DECODE_OPTIONS)
      .rotate() // EXIF の回転を焼き込み、その他メタデータ（GPS等）は破棄
      .resize(AVATAR_PIXEL_SIZE, AVATAR_PIXEL_SIZE, { fit: "cover" })
      .webp({ quality: AVATAR_WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    logExternalError(where, "画像の変換に失敗", error);
    return { error: "invalidImage" };
  }

  const filePath = avatarFilePath(userId);
  const { storage } = createAdminClient();

  const { error: uploadError } = await storage
    .from("avatars")
    .upload(filePath, processed, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    return { error: "uploadFailed" };
  }

  // 同一パスを上書きするため URL は不変。キャッシュバストにタイムスタンプを付与する。
  const {
    data: { publicUrl },
  } = storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  // 退会を受け付けた後なら URL を書かず、上げた画像も消す（退会の Storage の
  // 工程が先に済んでいると、ここで上げた画像は誰にも消されずに残る）
  const { written } = await writeAsAccount(userId, (tx) =>
    tx
      .update(profiles)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(profiles.id, userId)),
  );
  if (!written) {
    await storage.from("avatars").remove([filePath]);
    return { error: "unauthorized" };
  }

  // ランキングのキャッシュ（5 分）は行にアバター URL を含むため、ここで捨てないと
  // 一覧だけ古い画像を出し続ける。URL 末尾の ?t= は新しい URL が配られて初めて効く。
  // キャッシュのキーは (種目・期間・ページ) 単位でユーザー単位ではないので、
  // 一部だけを狙って捨てることはできない。アバター変更の頻度なら全体で購う。
  purgeLeaderboardCache();

  logActivityEvent({
    userId,
    action: "update_avatar",
    targetType: "user",
    targetId: userId,
  });

  return { avatarUrl };
}

/**
 * アバター画像を削除し、プロフィールの URL を空に戻す
 * アバター削除
 *
 * web の Route Handler とアプリ向け API の両方から呼ぶ。認証と回数制限は
 * 呼び出し側が済ませること。Storage の削除に失敗しても失敗にしない（下の
 * コメントの通り無害なため）。
 */
export async function removeAvatarForUser(userId: string): Promise<void> {
  // 先に参照（profiles.avatar_url）を切る。Storage の削除に失敗しても残るのは
  // 誰からも参照されないオブジェクトだけで、次のアップロードが同じパスを上書きする。
  // 逆順にすると失敗時に「消えた画像を指す URL」が残り、一覧が壊れた画像を出す。
  //
  // 保存と違い writeAsAccount を通さない。あのロックが防ぐのは「退会の
  // データ削除の後に書き込みが走り、消したはずのデータが残る」ことで、
  // ここは消すだけなので退会と前後しても残るものが無い（退会も同じ列を
  // NULL にし、同じ画像を消す）。
  await db
    .update(profiles)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  // 保存と同じ理由でランキングのキャッシュを捨てる（行にアバター URL を含む）。
  purgeLeaderboardCache();

  await createAdminClient()
    .storage.from("avatars")
    .remove([avatarFilePath(userId)]);

  logActivityEvent({
    userId,
    action: "delete_avatar",
    targetType: "user",
    targetId: userId,
  });
}
