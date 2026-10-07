import { Fragment } from "react";
import { Text } from "react-native";
import { isGlossaryTermSlug } from "@mahjong-scoring/features/glossary/registry";
import { parseTermMarkup } from "@mahjong-scoring/features/glossary/term-markup";

import { useTermLinksEnabled } from "../../hooks/use-display-settings-store";
import { linkStyles } from "../../lib/link-styles";
import { useOpenTerm } from "../../reference/term-sheet";

/**
 * 用語マークアップを解いた本文（web の `TermText`）
 * 用語入り本文
 *
 * 辞書の本文の `[[slug|表示語]]` を、押すと用語のシートを開く語にする
 * （本文中の語なので下線を引く — `linkStyles.inline`）。親の `<Text>` の中に
 * 置くこと。
 *
 * 辞書に無い slug と、設定で用語リンクを切っている読者には表示語だけを
 * 地の文として返す。語を覚えた読者にとって、段落ごとに下線が入るのは
 * 読む妨げでしかない。
 */
export function TermText({ children }: { readonly children: string }) {
  const enabled = useTermLinksEnabled();
  const openTerm = useOpenTerm();
  return (
    <>
      {parseTermMarkup(children).map((token, index) => {
        if (token.type === "text") {
          return <Fragment key={index}>{token.value}</Fragment>;
        }
        if (
          !enabled ||
          openTerm === undefined ||
          !isGlossaryTermSlug(token.slug)
        ) {
          return <Fragment key={index}>{token.label}</Fragment>;
        }
        const { slug } = token;
        return (
          <Text
            key={index}
            onPress={() => openTerm(slug)}
            accessibilityRole="link"
            style={linkStyles.inline}
          >
            {token.label}
          </Text>
        );
      })}
    </>
  );
}
