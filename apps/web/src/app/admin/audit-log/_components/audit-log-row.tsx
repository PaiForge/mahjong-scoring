import type { ModerationAction, Profile } from "../../../../lib/db";
import { formatAdminDateTime } from "../../_lib/format-date";
import { resolveUserDisplay } from "../../_lib/log-query-helpers";
import { adminChipClasses } from "../../_lib/chip-classes";

interface AuditLogRowProps {
  readonly log: ModerationAction;
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

/**
 * 監査ログの 1 行
 * 監査ログ行
 *
 * 対象が利用者（`targetId`）なら表示名に解決し、それ以外（広告・お知らせ・
 * トラッキング ID。`targetKey`）は種別と鍵をそのまま出す。変更前後の値は
 * metadata にあるので先頭だけ見せる（全文は Studio や SQL で読む）。
 */
export function AuditLogRow({ log, profileMap, emailMap }: AuditLogRowProps) {
  const targetDisplay = log.targetId
    ? resolveUserDisplay(log.targetId, profileMap, emailMap)
    : `${log.targetType}: ${log.targetKey ?? "-"}`;
  const actorDisplay = resolveUserDisplay(log.actorId, profileMap, emailMap);

  return (
    <tr className="border-t border-surface-200">
      <td className="px-4 py-3">
        <span
          className={adminChipClasses(
            log.action === "ban"
              ? "danger"
              : log.action === "unban"
                ? "success"
                : "neutral",
          )}
        >
          {log.action}
        </span>
      </td>
      <td className="px-4 py-3">{targetDisplay}</td>
      <td className="px-4 py-3 text-surface-500">{actorDisplay}</td>
      <td className="px-4 py-3">
        {log.reason ? (
          <span title={log.reason}>
            {log.reason.length > 50
              ? `${log.reason.slice(0, 50)}...`
              : log.reason}
          </span>
        ) : (
          <span className="text-surface-400">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-surface-500">
        {log.metadata && Object.keys(log.metadata).length > 0 ? (
          <code className="text-xs" title={JSON.stringify(log.metadata)}>
            {JSON.stringify(log.metadata).slice(0, 80)}
          </code>
        ) : (
          "-"
        )}
      </td>
      <td className="px-4 py-3 text-surface-500">{log.ipAddress ?? "-"}</td>
      <td className="px-4 py-3 text-surface-500">
        {formatAdminDateTime(log.createdAt)}
      </td>
    </tr>
  );
}
