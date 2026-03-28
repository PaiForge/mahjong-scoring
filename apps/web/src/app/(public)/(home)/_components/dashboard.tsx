export function Dashboard() {
  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-surface-900">ダッシュボード</h1>
        <p className="mt-2 text-sm text-surface-500">
          ここに学習進捗や最近のアクティビティが表示されます
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-surface-400">今日の練習</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">0 問</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-surface-400">正答率</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">-- %</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium text-surface-400">連続学習日数</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">0 日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
