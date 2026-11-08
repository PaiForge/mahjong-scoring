interface RiichiStickProps {
  /** 棒の上に添える名称（「リーチ」） */
  readonly label: string;
}

/**
 * リーチ棒（1000点棒）
 * リーチ棒
 *
 * リーチしている出題の目印。実卓では場に出された 1000 点棒がリーチの表明
 * そのものであるため、盤面でも文字だけでなく点棒の形で示す。
 * 1000 点棒は白地の中央に赤い丸が 1 つ。
 *
 * 名札は和了牌のラベルと同じ体裁で棒の真上に置く。盤面の中で「牌や道具に
 * 名前を添える」出し方をひとつに揃えている。
 */
export function RiichiStick({ label }: RiichiStickProps) {
  return (
    <span className="flex flex-col items-center">
      <span className="mb-0.5 text-[10px] font-bold leading-none text-white/70">
        {label}
      </span>
      <svg
        viewBox="0 0 54 10"
        aria-hidden="true"
        className="h-2.5 w-[54px] shrink-0"
      >
        <rect width="54" height="10" rx="3" className="fill-white" />
        <circle cx="27" cy="5" r="2.2" className="fill-destructive" />
      </svg>
    </span>
  );
}
