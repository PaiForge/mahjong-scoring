import type { ModerationAction, Profile } from "../../../../lib/db";
import { formatAdminDateTime } from "../../_lib/format-date";
import { resolveUserDisplay } from "../../_lib/log-query-helpers";

interface AuditLogRowProps {
  readonly log: ModerationAction;
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

export function AuditLogRow({ log, profileMap, emailMap }: AuditLogRowProps) {
  const targetDisplay = resolveUserDisplay(log.targetId, profileMap, emailMap);
  const actorDisplay = resolveUserDisplay(log.actorId, profileMap, emailMap);

  return (
    <tr className="border-t border-surface-200">
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            log.action === "ban"
              ? "bg-red-100 text-red-700"
              : log.action === "unban"
                ? "bg-primary-100 text-primary-700"
                : "bg-surface-100 text-surface-700"
          }`}
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
      <td className="px-4 py-3 text-surface-500">{log.ipAddress ?? "-"}</td>
      <td className="px-4 py-3 text-surface-500">
        {formatAdminDateTime(log.createdAt)}
      </td>
    </tr>
  );
}
