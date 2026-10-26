import "server-only";

import { eq } from "drizzle-orm";
import sharp from "sharp";

import { logActivityEvent } from "@/lib/activity-log";
import { purgeLeaderboardCache } from "@/lib/cache-tags";
import { accountDeletions, db, profiles } from "@/lib/db";
import { SHARP_DECODE_OPTIONS } from "@/lib/images/sharp-options";
import { logExternalError } from "@/lib/log-error";
import { createAdminClient } from "@/lib/supabase/admin";

import { writeAsAccount } from "./account-write-lock";

/*
 * アバター画像の保存と削除（web の /api/profile/avatar の本体）
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
 * web の Route Handler から呼ぶ。認証・回数制限・
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

  // 退会を受け付けた後なら URL を書かず、上げた画像も消す
  const { written } = await writeAsAccount(userId, (tx) =>
    tx
      .update(profiles)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(profiles.id, userId)),
  );
  if (!written) {
    await discardAvatarUploadedAfterDeletion(userId, where);
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
 * 退会の受付と行き違いで上げた画像を消す
 * 退会後のアバター破棄
 *
 * 退会の Storage の工程が先に済んでいると、ここで上げた画像は誰にも消されず、
 * 退会者の画像が公開 URL で読めるまま残る。消せなかったときは、退会の要求の
 * Storage の工程を未了に戻して cron（`processPendingAccountDeletions`）に
 * 拾わせる。工程はプレフィックスで一覧して消すので、この画像も含まれる。
 * 完了済みの要求も完了を外して戻す（cron は未完了の要求だけを読む）。
 * Apple の連携の取り消し（`lib/apple/refresh-tokens.ts`）と同じ戻し方で、
 * 済んでいる他の工程は飛ばされる。
 *
 * @design 退会の処理と同時に走ったとき
 * それでも画像が残るのは、ここで消すのに失敗し、かつ退会の処理が一覧した後・
 * 済みを記録する前に、この画像が上がって戻しまで終えたときだけ（済みの記録が
 * 戻しを上書きする）。
 * 受付の排他ロックと書き込みの共有ロックは要求の行が出来た後の書き込みを
 * 止めるだけで、Storage の工程とは直列にならない。閉じるには工程の一覧から
 * 済みの記録までを要求の行のロックで包む必要があり、Storage の失敗と退会の
 * 処理の数百ミリ秒が重なる確率に対して見合わないので採っていない。
 *
 * 戻しも失敗したら記録だけ残す（呼び出し元は退会後として 401 を返す）。
 */
async function discardAvatarUploadedAfterDeletion(
  userId: string,
  where: string,
): Promise<void> {
  try {
    await deleteAvatarObject(userId);
    return;
  } catch (error) {
    logExternalError(where, "退会後に上げたアバターの削除に失敗", error);
  }
  try {
    await db
      .update(accountDeletions)
      .set({ storageDeletedAt: null, completedAt: null })
      .where(eq(accountDeletions.userId, userId));
  } catch (error) {
    logExternalError(where, "退会の Storage の工程を未了に戻せなかった", error);
  }
}

/**
 * アバター画像を削除し、プロフィールの URL を空に戻す
 * アバター削除
 *
 * web の Route Handler から呼ぶ。認証と回数制限は呼び出し側が済ませること。
 *
 * 先に Storage の画像を消し、消せたときだけ参照（`profiles.avatar_url`）を切る。
 * avatars は公開バケットで、公開 URL は RLS を通らずに読める。参照を先に切ると、
 * Storage の削除に失敗しても本人には「消えた」と返り、画像は固定のパスで
 * 公開されたまま残る（再試行の手掛かりも失う）。この順なら Storage の失敗は
 * 失敗として返り、参照が残るので本人がそのまま削除をやり直せる。
 * 参照を切る側が失敗したときは消えた画像を指す URL が残るが、やり直せば
 * 削除は通る（無いパスの remove はエラーにならない）。
 *
 * 保存と違い writeAsAccount を通さない。あのロックが防ぐのは「退会の
 * データ削除の後に書き込みが走り、消したはずのデータが残る」ことで、
 * ここは消すだけなので退会と前後しても残るものが無い（退会も同じ列を
 * NULL にし、同じ画像を消す）。
 *
 * @returns Storage の削除に失敗したら `removeFailed`（プロフィールは触らない）
 */
export async function removeAvatarForUser(
  userId: string,
): Promise<{ readonly ok: true } | { readonly error: "removeFailed" }> {
  try {
    await deleteAvatarObject(userId);
  } catch (error) {
    logExternalError("removeAvatarForUser", "avatar removal", error);
    return { error: "removeFailed" };
  }

  await db
    .update(profiles)
    .set({ avatarUrl: null, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  // 保存と同じ理由でランキングのキャッシュを捨てる（行にアバター URL を含む）。
  purgeLeaderboardCache();

  logActivityEvent({
    userId,
    action: "delete_avatar",
    targetType: "user",
    targetId: userId,
  });
  return { ok: true };
}

/**
 * Storage からアバター画像を消す（プロフィールの URL は触らない）
 * アバター画像削除
 *
 * 本人の削除（{@link removeAvatarForUser}）と、管理者が通報を受けて
 * プロフィールの内容を消すとき（`admin/reports`）に使う。どちらも参照
 * （`profiles.avatar_url`）を切る前に呼び、失敗したら参照を残して止める。
 * 退会と行き違いで上げた画像の後始末（{@link discardAvatarUploadedAfterDeletion}）
 * にも使い、こちらは失敗したら退会の再試行に回す。
 *
 * supabase-js は Storage の失敗を投げずに `error` で返すため、ここで投げ直す。
 * サービスロールは RLS を通らないので、エラーが無ければオブジェクトは
 * 消えたか元から無い（どちらも目的は果たしている）。
 *
 * @throws Storage が削除に失敗したとき
 */
export async function deleteAvatarObject(userId: string): Promise<void> {
  const { error } = await createAdminClient()
    .storage.from("avatars")
    .remove([avatarFilePath(userId)]);
  if (error) throw new Error(`storage remove: ${error.message}`);
}
