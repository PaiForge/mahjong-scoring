import type { z } from "zod";

/**
 * スキーマで検証し、通ればその値を返す。形が違えば undefined
 * スキーマ検証
 *
 * アプリ向け API の応答パーサ（`parseMobile*Response`）が、応答をそのまま
 * 契約の型で返すときの定型（`safeParse` して成功なら `data`、失敗なら
 * undefined）。戻り値の型はスキーマの出力型から導出する。値を詰め替える・
 * 要素ごとに検証する応答は、この関数を通さず各パーサが書く。
 *
 * @param schema - 応答の契約を表す zod スキーマ
 * @param body - 検証する値（JSON をパースしたもの）
 */
export function parseWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  body: unknown,
): z.output<TSchema> | undefined {
  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}
