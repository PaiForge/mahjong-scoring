import type { getTranslations } from "next-intl/server";

/**
 * 章の翻訳関数
 * 教本翻訳関数
 *
 * 章の名前空間で解決済みの `t`。章の一部を共通コンポーネントへ切り出すとき、
 * そのコンポーネントに名前空間を渡して翻訳を引き直させると同じ辞書を二度
 * 読むことになるため、呼び出し側が既に持っている `t` をそのまま渡す。
 */
export type GuideTranslator = Awaited<
  ReturnType<typeof getTranslations<string>>
>;
