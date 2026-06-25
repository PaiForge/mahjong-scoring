/**
 * 画像のバイナリ先頭（マジックナンバー）を検証し、申告された MIME と一致するか確認する。
 * 拡張子や Content-Type 偽装によるアップロードを防ぐための追加防御。
 * 画像シグネチャ検証
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
