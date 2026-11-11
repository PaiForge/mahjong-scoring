import { getTranslations } from "next-intl/server";

interface ExpandableTextProps {
  /** 全文 */
  readonly text: string;
  /** 閉じている間に見せる文字数。これ以下ならそのまま出す */
  readonly maxLength: number;
  /** JSON などの機械向けの値。等幅で出し、区切りの無い列でも折り返す */
  readonly code?: boolean;
}

/**
 * 表のセルで長い値の先頭だけを見せ、押すと全文を開く
 * 全文の展開
 *
 * @design 続きを `title` 属性（hover のツールチップ）に置かない
 * 以前は先頭だけを出して全文を `title` に入れていたが、タブレットのタッチ操作では
 * hover が無く、続きを読む手段が無かった。`<details>` なら押す（タップ・Enter）だけで
 * 開き、JS も要らない。開いている間は先頭の切り抜きを隠して全文だけを出す。
 *
 * 切り詰めたときだけ最小幅（`min-w-48`）を持つ。表の列は中身の最小幅まで縮むので、
 * 開いた全文が 1〜2 文字幅の縦長になる。セル側に付けると短い値の列まで広がる。
 */
export async function ExpandableText({
  text,
  maxLength,
  code = false,
}: ExpandableTextProps) {
  const textClasses = code ? "font-mono text-xs break-all" : "break-words";

  if (text.length <= maxLength) {
    return <span className={textClasses}>{text}</span>;
  }

  const t = await getTranslations("admin.expandableText");

  return (
    <details className="group min-w-48">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className={`${textClasses} group-open:hidden`}>
          {text.slice(0, maxLength)}…{" "}
        </span>
        <span className="text-xs font-medium whitespace-nowrap text-surface-600 underline">
          <span className="group-open:hidden">{t("showAll")}</span>
          <span className="hidden group-open:inline">{t("hide")}</span>
        </span>
      </summary>
      <p className={`mt-1 whitespace-pre-wrap ${textClasses}`}>{text}</p>
    </details>
  );
}
