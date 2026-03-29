import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-surface-200 bg-surface-50 px-6 py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary-500 text-white">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm2.25-4.5h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm-2.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18v-6.75a2.25 2.25 0 00-2.25-2.25H15" />
              </svg>
            </div>
            <span className="text-sm font-bold">
              <span className="text-primary-700">Mahjong</span>
              <span className="text-surface-500">Scoring</span>
            </span>
          </div>
          <p className="mt-3 text-xs text-surface-400">{t("copyright")}</p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">{t("learn")}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/reference" className="text-surface-600 hover:text-primary-600 transition-colors">
                {t("scoreDrill")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">{t("training")}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/practice" className="text-surface-600 hover:text-primary-600 transition-colors">
                {t("scoreDrill")}
              </Link>
            </li>
          </ul>
        </div>

        <div className="hidden md:block">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">{t("other")}</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/terms" className="text-surface-600 hover:text-primary-600 transition-colors">
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-surface-600 hover:text-primary-600 transition-colors">
                {t("privacy")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
