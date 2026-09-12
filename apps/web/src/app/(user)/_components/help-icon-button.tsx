interface HelpIconButtonProps {
  readonly onClick: () => void;
  /** 読み上げ名。何のヘルプかが分かる文言にする（「この練習の進め方を見る」等） */
  readonly label: string;
  /** 余白などレイアウト調整用。色・形・大きさは上書きしない */
  readonly className?: string;
}

/**
 * ヘルプ・補足説明を開く「?」ボタン
 * ヘルプボタン
 *
 * 設定項目の補足、盤面のドラの見方、練習の進め方（カルーセル / ツアー）など、
 * 「押すと説明が出る」入口はすべてこれ。素の「?」の文字や線画のアイコンは
 * 地の文に紛れて押せることが伝わらないため、送信ボタンと同じ緑の塗りの丸に
 * 白抜きの太字で出す（緑 = 押せる面の記号）。ページ側で「?」のボタンを
 * 書き起こさない。
 *
 * 大きさは添える文字に合わせる（em 指定）。見出しの横なら見出しの文字に、
 * 出題文の横なら出題文に、状況行なら状況行の文字に揃う。
 */
export function HelpIconButton({
  onClick,
  label,
  className = "",
}: HelpIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex size-[1.25em] shrink-0 items-center justify-center rounded-full bg-primary-500 text-[0.75em] font-bold leading-none text-white transition-colors hover:bg-primary-600 ${className}`}
    >
      ?
    </button>
  );
}
