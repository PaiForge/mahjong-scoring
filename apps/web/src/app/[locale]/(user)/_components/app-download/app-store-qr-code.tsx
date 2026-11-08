import { buildQrCodePath } from "./_lib/qr-code-path";

/**
 * クワイエットゾーン（QR コードの周りの余白）のモジュール数
 *
 * 規格の推奨は 4。地の色（LP の淡い灰色など）に依らず読めるよう、余白ごと
 * SVG の白い下地に含める。
 */
const QUIET_ZONE = 4;

interface AppStoreQrCodeProps {
  /** QR コードが開く URL */
  readonly url: string;
  /** 読み上げ用の説明（何を開く QR コードか） */
  readonly label: string;
  /** 大きさ（`size-*` 等） */
  readonly className: string;
}

/**
 * App Store のアプリのページを開く QR コード
 * アプリQRコード
 *
 * デスクトップで見ている人がスマホのカメラで読み取るためのもの。スマホの
 * 画面に出しても自分では読み取れないので、置く側が `md` 未満では隠す。
 */
export function AppStoreQrCode({ url, label, className }: AppStoreQrCodeProps) {
  const { size, d } = buildQrCodePath(url);
  const extent = size + QUIET_ZONE * 2;

  return (
    <svg
      role="img"
      aria-label={label}
      className={className}
      viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${extent} ${extent}`}
      shapeRendering="crispEdges"
    >
      <rect
        x={-QUIET_ZONE}
        y={-QUIET_ZONE}
        width={extent}
        height={extent}
        fill="#ffffff"
      />
      <path d={d} fill="#000000" />
    </svg>
  );
}
