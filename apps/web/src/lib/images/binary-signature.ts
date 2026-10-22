import {
  IMAGE_SIGNATURES,
  matchesSignature,
  type SignedImageKind,
} from "@/lib/images/magic-bytes";

/**
 * 画像のバイナリ先頭（マジックナンバー）を検証し、申告された MIME と一致するか確認する。
 * 拡張子や Content-Type 偽装によるアップロードを防ぐための追加防御。
 * 画像シグネチャ検証
 *
 * ここが答えるのは「誰がアップロードしたか」ではなく「画像形式は何か」なので、
 * 呼び出し側のモジュールではなく画像モジュールに置く。サイズ上限と許可形式は
 * 面ごとに変わるポリシーなので {@link ../images/policy} が持つ。
 *
 * SVG を通すブランチが無いのは意図的。SVG は `<script>` やイベントハンドラを
 * 埋め込め、Supabase Storage のオブジェクト URL を直接開くとそれが実行される。
 * 表に無い MIME はすべて `false` になる。
 *
 * これは安価な門であってデコーダではない。呼び出し側は必ず sharp に通すこと
 * （壊れた画像・敵対的な画像を実際に弾くのはそちら）。
 */
export function validateImageBinarySignature(
  buffer: ArrayBuffer,
  declaredType: string,
): boolean {
  const kind = SIGNED_KIND_BY_MIME[declaredType];
  if (kind === undefined) return false;
  const header = new Uint8Array(buffer.slice(0, 12));
  return matchesSignature(header, IMAGE_SIGNATURES[kind]);
}

/** 申告される MIME → シグネチャの表のキー。無い MIME（SVG 等）は通さない */
const SIGNED_KIND_BY_MIME: Readonly<Record<string, SignedImageKind>> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};
