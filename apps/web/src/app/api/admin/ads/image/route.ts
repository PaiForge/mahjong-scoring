import sharp from "sharp";

import { requireAdmin } from "@/app/admin/_lib/auth";
import {
  AD_IMAGE_BUCKET,
  adImageUrlPrefix,
} from "@/app/admin/ads/_lib/image-url";
import { authorizeApiRequest } from "@/lib/api-auth";
import { jsonPrivate } from "@/lib/api-response";
import { logExternalError } from "@/lib/log-error";
import { readUploadedImage } from "@/lib/images/read-uploaded-image";
import { SHARP_DECODE_OPTIONS } from "@/lib/images/sharp-options";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * ネイティブ広告の画像のアップロード（POST）
 * 広告画像アップロードAPI
 *
 * 受け取った画像を検証し、Sharp で EXIF を除去して長辺 512px 以内の WebP に
 * 正規化したうえで `ad-creatives/<uuid>.webp` に保存し、公開 URL を返す。
 * 行への保存はしない — 返した URL を管理フォームが広告と一緒に保存する
 * （新規作成では広告の id がまだ無いため）。保存されずに残った画像は誰からも
 * 参照されないだけで害は無い。
 *
 * 書き込みはサービスロールで行う（バケットに書き込みポリシーは無い）。
 * 検証と WebP への正規化を必ず通すため。理由はアバターの API と同じで、
 * このバケットの `<uuid>.webp` は remotePatterns で `/_next/image` の入力に
 * なる。
 */

/** 長辺の上限。カードでは 80px 角に収めて描くので、高密度画面でも足りる */
const AD_IMAGE_MAX_EDGE = 512;
const AD_IMAGE_WEBP_QUALITY = 85;

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request, "uploadAdImage");
  if (!auth.ok) return auth.response;

  const admin = await requireAdmin();
  if ("error" in admin) {
    return jsonPrivate({ error: "forbidden" }, { status: 403 });
  }

  const image = await readUploadedImage(request);
  if (!image.ok) return image.response;

  let processed: Buffer;
  try {
    processed = await sharp(image.buffer, SHARP_DECODE_OPTIONS)
      .rotate()
      // 書影は縦長なので切り抜かない（fit: inside）。小さい画像は拡大しない
      .resize(AD_IMAGE_MAX_EDGE, AD_IMAGE_MAX_EDGE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: AD_IMAGE_WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    logExternalError("POST /api/admin/ads/image", "画像の変換に失敗", error);
    return jsonPrivate({ error: "invalidImage" }, { status: 400 });
  }

  const fileName = `${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await createAdminClient()
    .storage.from(AD_IMAGE_BUCKET)
    .upload(fileName, processed, { contentType: "image/webp" });

  if (uploadError) {
    return jsonPrivate({ error: "uploadFailed" }, { status: 500 });
  }

  // getPublicUrl ではなく検証側と同じ接頭辞から組み立てる。保存時の検証
  // （validateAdCreative）が同じ関数で照合するので、両者が食い違わない
  return jsonPrivate({
    success: true,
    url: `${adImageUrlPrefix()}${fileName}`,
  });
}
