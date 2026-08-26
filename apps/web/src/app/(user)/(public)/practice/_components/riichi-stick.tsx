interface RiichiStickProps {
  /** 読み上げとホバーに使う名称（「リーチ」） */
  readonly label: string;
}

/**
 * リーチ棒（1000点棒）
 * リーチ棒
 *
 * リーチしている出題の目印。実卓では場に出された 1000 点棒がリーチの表明
 * そのものであるため、盤面でも文字ではなく点棒の形で示す。
 * 1000 点棒は白地の中央に赤い丸が 1 つ。
 */
export function RiichiStick({ label }: RiichiStickProps) {
  return (
    <svg
      viewBox="0 0 36 10"
      role="img"
      aria-label={label}
      className="h-2.5 w-9 shrink-0"
    >
      <title>{label}</title>
      <rect width="36" height="10" rx="3" className="fill-white" />
      <circle cx="18" cy="5" r="2.2" className="fill-destructive" />
    </svg>
  );
}
