import { ExpandableText } from "./expandable-text";

/**
 * ログ行の metadata（変更前後の値など）を整形 JSON で見せるセル
 * metadata セル
 *
 * 空（null・キー無し）は「-」。長いときは先頭だけ見せ、押すと全文を開く。
 */
export function MetadataCell({
  metadata,
}: {
  readonly metadata: Record<string, unknown> | null;
}) {
  return (
    <td className="px-4 py-3 text-surface-500">
      {metadata && Object.keys(metadata).length > 0 ? (
        <ExpandableText
          text={JSON.stringify(metadata, null, 2)}
          maxLength={80}
          code
        />
      ) : (
        "-"
      )}
    </td>
  );
}
