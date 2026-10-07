interface NativeAdBadgeProps {
  /** 見える表記（「PR」） */
  readonly label: string;
  /** 読み上げる名前（「広告」） */
  readonly ariaLabel: string;
}

/**
 * 広告であることの表示（「PR」）
 * 広告表記
 *
 * ネイティブ広告は周りの項目と同じ形で並ぶため、広告であることはこの表記
 * だけが伝える（景品表示法のステルスマーケティング規制）。見た目は小さく
 * 保ちつつ、読み上げでは「広告」と読ませる。
 *
 * 押せる面の記号（太枠・影）は持たない。表記はリンクではなく添え書き。
 *
 * 文言は呼び出し側（`NativeAdCard` / `NativeAdRow`）が渡す。async にすると
 * 入れ子の async コンポーネントになり、単体テストで描画できなくなるため。
 */
export function NativeAdBadge({ label, ariaLabel }: NativeAdBadgeProps) {
  return (
    // aria-label は role を持たない span では読まれないことがあるため、
    // 見える表記は読み上げから外し、読む名前を sr-only で添える
    <span
      title={ariaLabel}
      className="inline-flex shrink-0 items-center rounded-md bg-surface-100 px-2 py-0.5 text-[11px] leading-none font-bold text-surface-500"
    >
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">{ariaLabel}</span>
    </span>
  );
}

/** 広告のリンクに付ける属性。新しいタブで開き、検索エンジンに広告と伝える */
export const NATIVE_AD_LINK_PROPS = {
  target: "_blank",
  rel: "sponsored noopener noreferrer",
} as const;
