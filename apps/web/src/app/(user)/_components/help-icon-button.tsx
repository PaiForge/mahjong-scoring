/** 置く面ごとの配色。`light` は白い面、`dark` は濃い緑の盤面 */
const TONE_CLASSES = {
  light: "bg-ink text-white hover:bg-primary-700",
  dark: "bg-white text-ink hover:bg-primary-100",
} as const;

/** 大きさ。`md` が既定。`sm` は牌の状況行のような背の低い行に添えるとき */
const SIZE_CLASSES = {
  sm: "size-5 text-xs",
  md: "size-6 text-sm",
} as const;

interface HelpIconButtonProps {
  readonly onClick: () => void;
  /** 読み上げ名。何のヘルプかが分かる文言にする（「この練習の進め方を見る」等） */
  readonly label: string;
  readonly tone?: keyof typeof TONE_CLASSES;
  readonly size?: keyof typeof SIZE_CLASSES;
  /** 余白などレイアウト調整用。色・形は上書きしない */
  readonly className?: string;
}

/**
 * ヘルプ・補足説明を開く「?」ボタン
 * ヘルプボタン
 *
 * 設定項目の補足、盤面のドラの見方、練習の進め方（カルーセル / ツアー）など、
 * 「押すと説明が出る」入口はすべてこれ。素の「?」の文字や線画のアイコンは
 * 地の文に紛れて押せることが伝わらないため、塗りの丸に白抜きの太字で出す
 * （見出し pill と同じ「濃い緑に白抜き」の語彙）。ページ側で「?」の
 * ボタンを書き起こさない。
 */
export function HelpIconButton({
  onClick,
  label,
  tone = "light",
  size = "md",
  className = "",
}: HelpIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none transition-colors ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]} ${className}`}
    >
      ?
    </button>
  );
}
