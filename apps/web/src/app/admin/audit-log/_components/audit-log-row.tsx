import type { ModerationAction, Profile } from '../../../../lib/db';

interface AuditLogRowProps {
  readonly log: ModerationAction;
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

export function AuditLogRow({ log, profileMap, emailMap }: AuditLogRowProps) {
  const targetProfile = profileMap.get(log.targetId);
  const targetDisplay =
    targetProfile?.username ?? emailMap.get(log.targetId) ?? log.targetId;
  const actorDisplay = emailMap.get(log.actorId) ?? log.actorId;

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            log.action === 'ban'
              ? 'bg-red-100 text-red-700'
              : log.action === 'unban'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {log.action}
        </span>
      </td>
      <td className="px-4 py-3">{targetDisplay}</td>
      <td className="px-4 py-3 text-gray-500">{actorDisplay}</td>
      <td className="px-4 py-3">
        {log.reason ? (
          <span title={log.reason}>
            {log.reason.length > 50 ? `${log.reason.slice(0, 50)}...` : log.reason}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500">{log.ipAddress ?? '-'}</td>
      <td className="px-4 py-3 text-gray-500">
        {new Date(log.createdAt).toLocaleString('ja-JP')}
      </td>
    </tr>
  );
}
