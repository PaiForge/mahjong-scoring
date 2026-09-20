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
 * 出題文の横なら出題文に、状況行なら状況行の文字に揃う。丸は添えた文字の
 * 1.5 倍の直径で、文字より一回り大きい（同じか小さいと、地の文の句読点の
 * ように見えて押せることが伝わらない）。
 *
 * 「?」の字だけを内側の span で縮めているのは、em を二重に解決させないため。
 * `size-[1.5em]` と `text-*` を同じ要素に置くと、size の em は縮めた後の
 * font-size を基準に解決され、丸が意図より小さくなる。
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
      className={`inline-flex size-[1.5em] shrink-0 items-center justify-center rounded-full bg-primary-500 font-bold leading-none text-white transition-colors hover:bg-primary-600 ${className}`}
    >
      {/* 丸の直径に対する字の大きさ（1.2 / 1.5 = 0.8） */}
      <span className="text-[1.2em]">?</span>
    </button>
  );
}
