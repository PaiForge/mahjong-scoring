import katex from "katex";

interface MathProps {
  /** LaTeX 数式文字列 */
  readonly latex: string;
}

/**
 * ブロック数式コンポーネント（displayMode）
 */
export function BlockMath({ latex }: MathProps) {
  const html = katex.renderToString(latex, {
    displayMode: true,
    throwOnError: false,
  });

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * インライン数式コンポーネント
 */
export function InlineMath({ latex }: MathProps) {
  const html = katex.renderToString(latex, {
    displayMode: false,
    throwOnError: false,
  });

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
