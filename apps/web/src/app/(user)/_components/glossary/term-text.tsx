import { Fragment } from "react";

import { isGlossaryTermSlug } from "@/lib/glossary/registry";
import { glossaryTermHref } from "@/lib/glossary/routes";
import { parseTermMarkup } from "@/lib/glossary/term-markup";

import { TermLink } from "./term-link";

interface TermTextProps {
  /** 辞書から引いた本文。`[[slug|表示語]]` を含んでよい */
  readonly children: string;
}

/**
 * 用語マークアップを解いた本文
 * 用語入り本文
 *
 * 辞書に書かれていない slug は素のテキストに落とす。綴りを間違えても
 * 404 へのリンクは作らず、表示語がそのまま本文として残る。
 */
export function TermText({ children }: TermTextProps) {
  return (
    <>
      {parseTermMarkup(children).map((token, index) => {
        if (token.type === "text") {
          return <Fragment key={index}>{token.value}</Fragment>;
        }
        if (!isGlossaryTermSlug(token.slug)) {
          return <Fragment key={index}>{token.label}</Fragment>;
        }
        return (
          <TermLink
            key={index}
            slug={token.slug}
            href={glossaryTermHref(token.slug)}
          >
            {token.label}
          </TermLink>
        );
      })}
    </>
  );
}
