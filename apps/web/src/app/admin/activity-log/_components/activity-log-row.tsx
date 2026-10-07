import type { Profile, UserActivityLog } from "../../../../lib/db";
import { formatAdminDateTime } from "../../_lib/format-date";
import { resolveUserDisplay } from "../../_lib/log-query-helpers";
import { adminChipClasses } from "../../_lib/chip-classes";

interface ActivityLogRowProps {
  readonly log: UserActivityLog;
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

export function ActivityLogRow({
  log,
  profileMap,
  emailMap,
}: ActivityLogRowProps) {
  const userDisplay = resolveUserDisplay(log.userId, profileMap, emailMap);
  const targetDisplay = log.targetId
    ? resolveUserDisplay(log.targetId, profileMap, emailMap)
    : "-";

  return (
    <tr className="border-t border-surface-200">
      <td className="px-4 py-3">
        <span className={adminChipClasses("neutral")}>{log.action}</span>
      </td>
      <td className="px-4 py-3">{userDisplay}</td>
      <td className="px-4 py-3 text-surface-500">
        {log.targetType ? `${log.targetType}: ${targetDisplay}` : targetDisplay}
      </td>
      <td className="px-4 py-3 text-surface-500">
        {log.metadata && Object.keys(log.metadata).length > 0 ? (
          <code className="text-xs">
            {JSON.stringify(log.metadata).slice(0, 80)}
          </code>
        ) : (
          "-"
        )}
      </td>
      <td className="px-4 py-3 text-surface-500">
        {formatAdminDateTime(log.createdAt)}
      </td>
    </tr>
  );
}
