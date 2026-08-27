/**
 * ファイル選択時にブラウザ側で行う画像の正規化。サーバの画像エンドポイントへ
 * 送る前に必ず通す。
 * アップロード前画像正規化
 *
 * blindfold-chess から移植（本番で踏んだ問題がそのまま設計になっている）。
 *
 * @why iPhone は既定で HEIC/HEIF で撮影する。サーバは JPEG/PNG/WebP しか
 *   受け付けず、それ以外は理由の分からない汎用エラーで弾くため、iPhone の写真は
 *   「なぜか上がらない」ことになる。加えてサーバはリサイズ前のバイト数で上限を
 *   見るので、HEIC を JPEG に変換しただけでは上限を超えることも多い。
 *   ここで HEIC → JPEG 変換と縮小・再圧縮を済ませ、サーバへは常に web 向けの
 *   ファイルが届くようにする。サーバ側の契約は変わらない（MIME・マジックバイト・
 *   サイズを最終的に判断するのは引き続きサーバ）。
 *
 * @design
 * - **判定は `file.type` ではなくマジックバイト。** iOS Safari は HEIC を
 *   `type: ""` で渡してくることがあり、MIME や拡張子で分岐すると取りこぼす。
 * - **HEIC デコーダ（libheif wasm, 1MB 超）は HEIC を検出したときだけ
 *   動的 import する。** 通常の JPEG/PNG/WebP はバンドルに引き込まない。
 * - **仕事は条件付き。** 上限内の web 対応形式はそのまま返す（恒等）。処理が
 *   走るのは HEIC（常時）か、上限超え（バイト数 or 長辺）のときだけ。
 * - **キャンバスを大きくしない。** iOS Safari はハードウェアの面積上限を超えた
 *   キャンバスを無言で読み出し失敗にする。原寸（48MP 級）は確保せず、
 *   出力キャンバスは縮小後のサイズ（長辺 ≤ {@link MAX_LONG_EDGE}）に留める。
 */
import { IMAGE_MIME_TO_EXTENSION } from "@/lib/images/policy";

/** 長辺の上限。これを超える画像は縮小する */
export const MAX_LONG_EDGE = 2048;

/** 再エンコード後に狙うバイト数。サーバの上限より十分小さく取る */
export const TARGET_MAX_BYTES = 1_800_000;

/** 目標バイト数に収まるまで順に試す JPEG/WebP の品質 */
const QUALITY_LADDER = [0.85, 0.72, 0.6, 0.5] as const;

export type SniffedImageKind = "heic" | "jpeg" | "png" | "webp" | "other";

// iOS などの HEIF エンコーダが出力するメジャーブランド
const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "heim",
  "heis",
  "hevc",
  "hevx",
  "mif1",
  "msf1",
  "heif",
]);

/**
 * 先頭バイトから画像形式を判定する。DOM 無しで単体テストできるよう純粋・同期。
 * ここで見分けたい形式だけを認識し、それ以外は `"other"` としてサーバの判断に委ねる。
 * 画像形式スニフ
 */
export function sniffImageKind(bytes: Uint8Array): SniffedImageKind {
  // JPEG: FF D8 FF
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  // HEIC/HEIF: ISO-BMFF の `ftyp` ボックス（4..8 バイト）+ HEIF 系ブランド
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 // p
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (HEIF_BRANDS.has(brand)) return "heic";
  }
  return "other";
}

/**
 * web 対応形式（JPEG/PNG/WebP）を再処理する必要があるか。
 * サイズ・寸法のポリシーを単体テストできるよう純粋関数にしてある。
 * HEIC は常にデコードが要るので、ここには渡らない。
 * 再処理要否判定
 */
export function needsResize(sizeBytes: number, longestEdge: number): boolean {
  return sizeBytes > TARGET_MAX_BYTES || longestEdge > MAX_LONG_EDGE;
}

/** 長辺を {@link MAX_LONG_EDGE} まで落とす倍率（1 以下） */
export function computeScale(width: number, height: number): number {
  const longest = Math.max(width, height);
  return longest > MAX_LONG_EDGE ? MAX_LONG_EDGE / longest : 1;
}

/**
 * 画像を準備できなかった理由。
 *
 * 2 つは別の事件として扱う。`decodeFailed` はこのブラウザがデコードできない
 * ファイルをユーザーが選んだということ（想定内。本人に伝える価値がある）。
 * `encodeFailed` はこちらの canvas パイプラインが壊れたということ
 * （2d コンテキストが取れない、`toBlob` が null）で、こちらはバグとして
 * ログに残す価値がある。
 */
export type ImageConversionFailure = "decodeFailed" | "encodeFailed";

/** 正規化の結果。失敗も戻り値で表す（ファイル選択の失敗は例外的事態ではない） */
export type PrepareImageResult =
  | { readonly ok: true; readonly file: File }
  | { readonly ok: false; readonly reason: ImageConversionFailure };

/**
 * 選択された画像をアップロード向けに正規化する。
 * アップロード用画像準備
 *
 * @returns すでに web 対応形式かつ上限内ならそのファイルをそのまま、
 *   そうでなければ変換・縮小した新しい `File`、準備できなければその理由。
 */
export async function prepareImageForUpload(
  file: File,
): Promise<PrepareImageResult> {
  const header = await readLeadingBytes(file, 32);
  const kind = sniffImageKind(header);

  if (kind === "heic") {
    return convertHeic(file);
  }

  // web 対応形式は上限を超えているものだけ触る。
  if (kind === "jpeg" || kind === "png" || kind === "webp") {
    return maybeResizeWebSafe(file, kind);
  }

  // こちらの知らない形式。サーバの判断に委ねる（従来どおりの挙動）。
  return { ok: true, file };
}

async function convertHeic(file: File): Promise<PrepareImageResult> {
  let bitmap: ImageBitmap;
  try {
    const { heicTo } = await import("heic-to");
    bitmap = await heicTo({ blob: file, type: "bitmap" });
  } catch {
    return { ok: false, reason: "decodeFailed" };
  }
  try {
    const blob = await encodeFromBitmap(
      bitmap,
      "image/jpeg",
      bitmap.width,
      bitmap.height,
    );
    return {
      ok: true,
      file: new File([blob], renameExtension(file.name, "jpg"), {
        type: "image/jpeg",
      }),
    };
  } catch {
    return { ok: false, reason: "encodeFailed" };
  } finally {
    bitmap.close();
  }
}

async function maybeResizeWebSafe(
  file: File,
  kind: "jpeg" | "png" | "webp",
): Promise<PrepareImageResult> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // 寸法を測るためのデコードに失敗した。元のファイルをサーバへ渡し、
    // 妥当なら受理、そうでなければサーバの検証で弾いてもらう。
    return { ok: true, file };
  }
  try {
    if (!needsResize(file.size, Math.max(bitmap.width, bitmap.height))) {
      return { ok: true, file };
    }
    const outputMime = `image/${kind}`;
    const blob = await encodeFromBitmap(
      bitmap,
      outputMime,
      bitmap.width,
      bitmap.height,
    );
    // encodeFromBitmap は PNG が縮まらないとき JPEG に切り替える。
    // 最終的な MIME・拡張子は要求値ではなく Blob の type が正。
    const finalMime = blob.type || outputMime;
    const ext = MIME_TO_EXT[finalMime] ?? "jpg";
    return {
      ok: true,
      file: new File([blob], renameExtension(file.name, ext), {
        type: finalMime,
      }),
    };
  } catch {
    // それ以外は妥当なファイルの縮小に失敗しただけ。ユーザーを止めるより
    // 元のファイルでアップロードを試みる方がよい。
    return { ok: true, file };
  } finally {
    bitmap.close();
  }
}

/**
 * ビットマップを縮小したキャンバスへ描いてエンコードする。非可逆形式は
 * {@link TARGET_MAX_BYTES} に収まるまで品質ラダーを降りる。
 *
 * PNG は可逆なので、縮小してもなお目標を超えるときは（canvas の PNG 再エンコードは
 * 最適化済みの元画像より**膨らむ**ことすらある。blindfold-chess では 2.45MB の
 * iPhone スクリーンショットで実際に発生した）透過を白で潰して JPEG ラダーへ落とす。
 * 返る Blob の `type` が最終的な MIME の正であり、呼び出し側は要求した mime では
 * なくそちらを見ること。
 */
async function encodeFromBitmap(
  bitmap: ImageBitmap,
  outputMime: string,
  width: number,
  height: number,
): Promise<Blob> {
  const scale = computeScale(width, height);
  const dw = Math.max(1, Math.round(width * scale));
  const dh = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  ctx.drawImage(bitmap, 0, 0, dw, dh);

  let mime = outputMime;
  if (mime === "image/png") {
    const png = await canvasToBlob(canvas, mime);
    if (png.size <= TARGET_MAX_BYTES) return png;
    // 既存のピクセルの「後ろ」に白を敷く。そのまま JPEG にすると
    // 透過部分が黒く落ちるため。
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, dw, dh);
    mime = "image/jpeg";
  }

  let last: Blob | undefined;
  for (const quality of QUALITY_LADDER) {
    const blob = await canvasToBlob(canvas, mime, quality);
    last = blob;
    if (blob.size <= TARGET_MAX_BYTES) return blob;
  }
  // どの品質でも目標に届かなかった。いちばん小さい最後の 1 枚を返す。
  if (!last) throw new Error("encode produced no blob");
  return last;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("toBlob returned null")),
      type,
      quality,
    );
  });
}

const MIME_TO_EXT: Record<string, string> = IMAGE_MIME_TO_EXTENSION;

async function readLeadingBytes(
  file: File,
  count: number,
): Promise<Uint8Array> {
  const slice = file.slice(0, count);
  // `Blob.prototype.arrayBuffer` が速いが、古い Safari と jsdom には無い。
  // バイト判定はどこでも動く必要があるので FileReader へフォールバックする。
  if (typeof slice.arrayBuffer === "function") {
    return new Uint8Array(await slice.arrayBuffer());
  }
  return new Uint8Array(await blobToArrayBuffer(slice));
}

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsArrayBuffer(blob);
  });
}

/** 生成した MIME に合わせてファイル名の拡張子を差し替える */
function renameExtension(name: string, ext: string): string {
  const base = name.replace(/\.[^./\\]+$/, "");
  return `${base || "image"}.${ext}`;
}
