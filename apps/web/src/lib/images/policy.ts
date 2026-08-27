/**
 * 画像アップロードで受け付ける形式と、1 ファイルあたりの上限。
 * 画像アップロードポリシー
 *
 * blindfold-chess から移植。あちらでは許可リストが 5 箇所（投稿画像・管理画像・
 * アバター API・アバターのフォーム・記事エディタ）に写しで存在し、サーバだけ
 * 緩めてクライアントを直し忘れても型エラーが出なかった。片側だけ変えると
 * 「一方が受け取る気のファイルを他方が弾く」ので、定義はここ 1 箇所に置く。
 *
 * 何も import しない。クライアントコンポーネントからも読めるようにするため。
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/**
 * クライアント由来の文字列（`File.type` 等）が許可形式かを判定する。
 * 呼び出し側は `string` を持っていて絞り込みたいので、`includes` ではなく
 * 型ガードとして提供する。
 * 許可画像形式判定
 */
export function isAllowedImageMimeType(type: string): type is ImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

/** 形式ごとの拡張子。クライアント側で再エンコードしたファイル名に使う */
export const IMAGE_MIME_TO_EXTENSION: Record<ImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** アバター 1 ファイルのバイト上限（Supabase Storage のバケット上限と一致させる） */
export const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024;
