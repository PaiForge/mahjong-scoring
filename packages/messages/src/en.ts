import metadata from "./en/metadata.json";
import nav from "./en/nav.json";
import reference from "./en/reference.json";
import scoreTable from "./en/score-table.json";
import footer from "./en/footer.json";
import common from "./en/common.json";
import notifications from "./en/notifications.json";
import notFound from "./en/not-found.json";
import type {
  EnTranslatedNamespace,
  MessagesShape,
} from "./translation-status";

/**
 * 英語の辞書（完訳した名前空間だけ）
 * 英語辞書
 *
 * `ja.ts` と同じ命名・束ね方（名前空間ごとに `en/<名前空間のケバブケース>.json` を
 * 1 つ置き、ここで束ねる）。web とモバイルで辞書を分けない。辞書キーはレジストリと
 * 結び付いた契約（`reference.<key>.{title,description}`・`scoreTable.<HIGH_SCORES の nameKey>`・
 * `nav.<labelKey>` 等）なので、キーは日本語と同じ文字列を使う。
 *
 * 束ねるのは `translation-status.ts` の完訳の名前空間だけで、未着手の名前空間は
 * 持たない。読む側は言語ごとにこの束か `ja.ts` の束の一方だけを使い、日本語へ
 * fallback しない。完訳の名前空間の形は日本語と同じでなければならず、型
 * （`MessagesShape` を満たすこと）と `en.test.ts`（余分なキー・ICU の引数・
 * 日本語の残り）が検査する。
 *
 * 名前空間を訳し終えたら、ファイルを置き、ここに import と 1 行を足し、
 * `translation-status.ts` で未着手から完訳へ移す。
 */
export const messages = {
  metadata,
  nav,
  reference,
  scoreTable,
  footer,
  common,
  notifications,
  notFound,
} satisfies Pick<MessagesShape, EnTranslatedNamespace>;

/** 英語の辞書の型（完訳の名前空間 → 文言の木） */
export type Messages = typeof messages;
