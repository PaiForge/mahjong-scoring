import type { ComponentPropsWithoutRef } from "react";

import type { Root } from "mdast";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { SectionTitle } from "./section-title";

interface MarkdownRendererProps {
  readonly content: string;
  /** 先頭の h1 を描画しない（ページ側でタイトルを別途表示する場合に使う） */
  readonly skipFirstH1?: boolean;
}

/**
 * 先頭の h1 を AST から取り除く remark プラグイン
 *
 * @remarks
 * 描画中にカウンタ変数を書き換える実装だと、レンダーの回数によって結果が
 * 変わってしまう。パース結果に対する変換として表現することで冪等にする。
 * setext 形式（`Title` + `===`）の見出しも同じ heading ノードになるため扱える。
 */
function remarkDropFirstH1() {
  return (tree: Root) => {
    const index = tree.children.findIndex(
      (node) => node.type === "heading" && node.depth === 1,
    );
    if (index !== -1) {
      tree.children.splice(index, 1);
    }
  };
}

function isExternalHref(href: string | undefined): boolean {
  return (
    href?.startsWith("http://") === true ||
    href?.startsWith("https://") === true
  );
}

/**
 * Markdown レンダラー
 *
 * @description
 * お知らせ本文など、信頼できる管理者が入力した Markdown を描画する。
 * Tailwind のデザイントークン（surface / primary）で各要素をスタイルし、
 * @tailwindcss/typography には依存しない。
 *
 * @remarks 外部リンクには rel="noopener noreferrer" target="_blank" を付与する。
 */
export function MarkdownRenderer({
  content,
  skipFirstH1 = false,
}: MarkdownRendererProps) {
  // 本文既定の font-weight 700 は長文だと読みづらいため、ここだけ通常の太さへ戻す。
  return (
    <div className="font-normal text-surface-700 leading-relaxed break-words">
      <Markdown
        remarkPlugins={
          skipFirstH1 ? [remarkGfm, remarkDropFirstH1] : [remarkGfm]
        }
        components={{
          h1: ({ children }) => (
            <h1 className="mt-8 mb-3 text-xl font-bold text-surface-900">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <SectionTitle className="mt-8 mb-3 first:mt-0">
              {children}
            </SectionTitle>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 mb-2 text-base font-semibold text-surface-900">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-3">{children}</p>,
          a: ({ href, children }) =>
            isExternalHref(href) ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 underline hover:text-primary-700"
              >
                {children}
              </a>
            ) : (
              <a
                href={href}
                className="text-primary-600 underline hover:text-primary-700"
              >
                {children}
              </a>
            ),
          ul: ({ children }) => (
            <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-surface-900">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-ink pl-4 text-surface-600 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-surface-200" />,
          code: ({
            className,
            children,
            ...rest
          }: ComponentPropsWithoutRef<"code">) => {
            const isBlock =
              typeof className === "string" && className.includes("language-");
            if (isBlock) {
              return (
                <code className={className} {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-md bg-surface-100 px-1.5 py-0.5 font-mono text-sm text-surface-800">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-50">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-2 border-ink bg-primary-50 px-3 py-2 text-left font-bold text-surface-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-2 border-ink px-3 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
