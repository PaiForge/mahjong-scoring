import type { Profile, UserActivityLog } from '../../../../lib/db';

interface ActivityLogRowProps {
  readonly log: UserActivityLog;
  readonly profileMap: Map<string, Profile>;
  readonly emailMap: Map<string, string>;
}

export function ActivityLogRow({ log, profileMap, emailMap }: ActivityLogRowProps) {
  const profile = profileMap.get(log.userId);
  const userDisplay =
    profile?.username ?? emailMap.get(log.userId) ?? log.userId;
  const targetDisplay = log.targetId
    ? (profileMap.get(log.targetId)?.username ??
        emailMap.get(log.targetId) ??
        log.targetId)
    : '-';

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-3">
        <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {log.action}
        </span>
      </td>
      <td className="px-4 py-3">{userDisplay}</td>
      <td className="px-4 py-3 text-gray-500">
        {log.targetType ? `${log.targetType}: ${targetDisplay}` : targetDisplay}
      </td>
      <td className="px-4 py-3 text-gray-500">
        {log.metadata && Object.keys(log.metadata).length > 0 ? (
          <code className="text-xs">
            {JSON.stringify(log.metadata).slice(0, 80)}
          </code>
        ) : (
          '-'
        )}
      </td>
      <td className="px-4 py-3 text-gray-500">
        {new Date(log.createdAt).toLocaleString('ja-JP')}
      </td>
    </tr>
  );
}
