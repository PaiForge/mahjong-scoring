import { OutlineIcon } from "./outline-icon";

interface BeltIconProps {
  readonly className?: string;
}

/**
 * 帯（段級位）アイコン
 * 帯アイコン
 *
 * 段級位の紋章。参考プロジェクト（blindfold-chess）が段級位に帯を使って
 * いるのに合わせる。道場・昇級バナー・段級位バッジはすべてこれを使い、
 * 段級位を別のモチーフ（角帽など）で表さない。
 *
 * 参考プロジェクトは `react-icons/gi` の `GiBlackBelt`（512 四方の塗り
 * ベース）をインラインしているが、あれは塗りが輪郭線しか覆わない細い線画で、
 * ナビの 20px では潰れて読めない。ここでは同じ帯のモチーフを
 * {@link OutlineIcon} の線画体系で描き直し、他のナビアイコンと線の太さを
 * 揃えている。
 *
 * 図形は「横一文字の帯 + 中央の結び目 + 垂れた両端」。結び目は帯より背を
 * 高くし、垂れは外へ振る — 帯と同じ高さの箱を並べると、小さいサイズでは
 * 3 分割された長方形（引き出しや鞄）にしか見えないため。
 */
export function BeltIcon({ className = "size-5" }: BeltIconProps) {
  return (
    <OutlineIcon className={className}>
      <path d="M2 8h7v5H2z" />
      <path d="M15 8h7v5h-7z" />
      <path d="M9 6h6v9H9z" />
      <path d="m10.5 15-1 4" />
      <path d="m13.5 15 1 4" />
    </OutlineIcon>
  );
}
