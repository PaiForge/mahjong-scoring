import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-surface-200 bg-surface-50 px-6 py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-xs">
              麻
            </div>
            <span className="text-sm font-bold">
              <span className="text-primary-700">Mahjong</span>
              <span className="text-surface-500">Scoring</span>
            </span>
          </div>
          <p className="mt-3 text-xs text-surface-400">&copy; 2026 PaiForge</p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">学ぶ</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/reference" className="text-surface-600 hover:text-primary-600 transition-colors">
                点数表
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">練習</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/practice" className="text-surface-600 hover:text-primary-600 transition-colors">
                点数計算ドリル
              </Link>
            </li>
          </ul>
        </div>

        <div className="hidden md:block">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">その他</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/terms" className="text-surface-600 hover:text-primary-600 transition-colors">
                利用規約
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-surface-600 hover:text-primary-600 transition-colors">
                プライバシーポリシー
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
