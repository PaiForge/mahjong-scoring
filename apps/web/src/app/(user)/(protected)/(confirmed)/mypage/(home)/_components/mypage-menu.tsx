import Link from "next/link";
import { useTranslations } from "next-intl";

import { BellIcon } from "@/app/(user)/_components/icons/bell-icon";
import { BeltIcon } from "@/app/(user)/_components/icons/belt-icon";
import { ChartIcon } from "@/app/(user)/_components/icons/chart-icon";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { OutlineIcon } from "@/app/(user)/_components/icons/outline-icon";
import { UserIcon } from "@/app/(user)/_components/icons/user-icon";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

function PlanIcon() {
  return (
    <OutlineIcon className="size-5">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </OutlineIcon>
  );
}

const items = [
  { key: "challenges", href: "/mypage/challenges", icon: ChartIcon },
  { key: "plan", href: "/mypage/plan", icon: PlanIcon },
  { key: "notifications", href: "/mypage/notifications", icon: BellIcon },
  { key: "dojo", href: "/dojo", icon: BeltIcon },
  { key: "account", href: "/mypage/account", icon: UserIcon },
] as const;

const panelClasses =
  "overflow-hidden rounded-xl border border-surface-200 bg-card";
const rowClasses =
  "flex min-h-24 items-center gap-3 px-4 py-5 sm:gap-4 sm:px-5";

/** マイページ専用のナビゲーション。矢印と行全体の反応で遷移先を示す。 */
export function MyPageMenu() {
  const t = useTranslations("mypage");

  return (
    <nav aria-label={t("menuLabel")} className={panelClasses}>
      <ul className="divide-y divide-surface-200">
        {items.map(({ key, href, icon: Icon }) => {
          const featured = key === "challenges";
          return (
            <li key={key}>
              <Link
                href={href}
                className={`group ${rowClasses} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${featured ? "bg-primary-50/60 hover:bg-primary-50" : "hover:bg-surface-50"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${featured ? "bg-primary-100 text-primary-800" : "bg-surface-100 text-surface-600"}`}
                >
                  <Icon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold tracking-wide text-foreground sm:text-base">
                    {t(`cards.${key}.title`)}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-surface-500 sm:text-sm">
                    {t(`cards.${key}.summary`)}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-surface-400 transition-colors group-hover:text-foreground group-focus-visible:text-foreground"
                >
                  <ChevronRightIcon />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 実表示と同じ項目数・余白を保つ読み込み表示。 */
export function MyPageMenuSkeleton() {
  return (
    <div aria-hidden="true" className={panelClasses}>
      <ul className="divide-y divide-surface-200">
        {items.map(({ key }) => (
          <li key={key} className={rowClasses}>
            <SkeletonBar radius="lg" className="size-11 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex h-5 items-center sm:h-6">
                <SkeletonBar className="h-3.5 w-28" />
              </div>
              <div className="mt-1 flex h-5 items-center sm:h-6">
                <SkeletonBar className="h-3 w-5/6" tone={100} />
              </div>
            </div>
            <SkeletonBar className="size-4 shrink-0" tone={100} />
          </li>
        ))}
      </ul>
    </div>
  );
}
