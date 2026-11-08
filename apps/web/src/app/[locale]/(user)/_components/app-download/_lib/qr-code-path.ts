import QRCode from "qrcode";

/**
 * QR コードの図形（SVG の path）
 * QRコード図形
 */
export interface QrCodePath {
  /** 1 辺のモジュール数（クワイエットゾーンを含まない） */
  readonly size: number;
  /** 暗いモジュールを 1×1 の正方形で並べた `d` 属性 */
  readonly d: string;
}

/**
 * 文字列を QR コードにし、暗いモジュールを SVG の path にする
 * QRコード生成
 *
 * `qrcode` の `toString({ type: "svg" })` は SVG の文字列を返すので、描画に
 * `dangerouslySetInnerHTML` が要る。モジュールの行列（`QRCode.create`）から
 * path を組めば JSX のまま描け、サーバーコンポーネントで静的に出せる
 * （クライアントへ JS を送らない）。誤り訂正は M（約 15%）。画面に出すだけで
 * 汚れや欠けを考えなくてよく、L より読み取りの角度に強い。
 *
 * @param text - 埋め込む文字列（URL）
 * @returns モジュール数と path
 */
export function buildQrCodePath(text: string): QrCodePath {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const segments: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) {
        segments.push(`M${col} ${row}h1v1h-1z`);
      }
    }
  }
  return { size: modules.size, d: segments.join("") };
}
