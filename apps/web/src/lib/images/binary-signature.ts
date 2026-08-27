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
 * 分岐の無い MIME はすべて末尾の `return false` に落ちる。
 *
 * これは安価な門であってデコーダではない。呼び出し側は必ず sharp に通すこと
 * （壊れた画像・敵対的な画像を実際に弾くのはそちら）。
 */
export function validateImageBinarySignature(
  buffer: ArrayBuffer,
  declaredType: string,
): boolean {
  const header = new Uint8Array(buffer.slice(0, 12));

  if (declaredType === "image/jpeg") {
    // FF D8 FF
    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  }

  if (declaredType === "image/png") {
    // 89 50 4E 47 0D 0A 1A 0A
    return (
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47 &&
      header[4] === 0x0d &&
      header[5] === 0x0a &&
      header[6] === 0x1a &&
      header[7] === 0x0a
    );
  }

  if (declaredType === "image/webp") {
    // "RIFF" .... "WEBP"
    return (
      header[0] === 0x52 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x46 &&
      header[8] === 0x57 &&
      header[9] === 0x45 &&
      header[10] === 0x42 &&
      header[11] === 0x50
    );
  }

  return false;
}
