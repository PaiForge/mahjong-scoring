/**
 * 画像形式のマジックナンバー（先頭バイトのシグネチャ）
 * 画像マジックナンバー
 *
 * クライアント（アップロード前の形式判定 `sniffImageKind`）とサーバー
 * （申告された MIME との照合 `validateImageBinarySignature`）が同じ表を読む。
 * DOM にも Node にも依存しない純粋なモジュール。
 *
 * HEIC/HEIF はここに無い。ISO-BMFF の `ftyp` ボックスとブランドの組で
 * 判定するため固定のバイト列で表せず、サーバーも受け付けない（クライアントで
 * JPEG に変換してから送る）。
 */

/** 先頭からのオフセットと、そこに並ぶべきバイト列 */
export interface ByteSignature {
  readonly offset: number;
  readonly bytes: readonly number[];
}

/** 判定できる web 向けの画像形式 */
export type SignedImageKind = "jpeg" | "png" | "webp";

/**
 * 形式ごとのシグネチャ。1 つの形式が複数の部分（WebP の RIFF と WEBP）を
 * 持つときはすべて一致したときだけ、その形式と判定する
 */
export const IMAGE_SIGNATURES: Readonly<
  Record<SignedImageKind, readonly ByteSignature[]>
> = {
  // FF D8 FF
  jpeg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  // 89 50 4E 47 0D 0A 1A 0A
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  // "RIFF" .... "WEBP"
  webp: [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
};

/** 判定の順。JPEG → PNG → WebP で、先に一致した形式を採る */
export const SIGNED_IMAGE_KINDS: readonly SignedImageKind[] = [
  "jpeg",
  "png",
  "webp",
];

/**
 * 先頭バイトがシグネチャのすべての部分に一致するか。短すぎる入力は一致しない
 * シグネチャ照合
 */
export function matchesSignature(
  header: Uint8Array,
  signature: readonly ByteSignature[],
): boolean {
  return signature.every(({ offset, bytes }) =>
    bytes.every((byte, i) => header[offset + i] === byte),
  );
}
