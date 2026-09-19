import katex from "katex";

/** KaTeX CSS（数式レンダリング用） */
const KATEX_CSS_HREF =
  "https://cdn.jsdelivr.net/npm/katex@0.18.2/dist/katex.min.css";

/**
 * KaTeX のスタイルシート
 *
 * `katex.renderToString` が返す HTML は、この CSS が無いと崩れて表示される
 * （読み上げ用に併記される MathML が隠されず、同じ式が二重に出る）。
 * ページ側で `<link>` を書く形にしていると、数式を使う章が増えたときに
 * 付け忘れが起きるため、数式コンポーネント自身に持たせている。
 *
 * `precedence` を渡すと React が head へ巻き上げて href で重複を排除するので、
 * 1ページに数式がいくつあっても読み込みは1回になる。
 */
function KatexStylesheet() {
  return <link rel="stylesheet" href={KATEX_CSS_HREF} precedence="default" />;
}

interface MathProps {
  /** LaTeX 数式文字列 */
  readonly latex: string;
}

/**
 * ブロック数式コンポーネント（displayMode）
 *
 * 溢れたぶんは数式の中で横スクロールさせる。数式は語の途中で折り返せず、
 * 「子のロン : 親が出す : 子が出す = 4 : 2 : 1」のように日本語を含む式は
 * 狭い画面に収まらない。放っておくとページ全体が横に流れて本文まで動く
 * （320px の /learn/ron-to-tsumo で実測 48px。式そのものは 352px あり、
 * 本文の幅 288px に対して 64px はみ出していた）。
 */
export function BlockMath({ latex }: MathProps) {
  const html = katex.renderToString(latex, {
    displayMode: true,
    throwOnError: false,
  });

  return (
    <>
      <KatexStylesheet />
      <div
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}

/**
 * インライン数式コンポーネント
 */
export function InlineMath({ latex }: MathProps) {
  const html = katex.renderToString(latex, {
    displayMode: false,
    throwOnError: false,
  });

  return (
    <>
      <KatexStylesheet />
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}
