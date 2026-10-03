"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AdminNavGroup {
  readonly label: string;
  readonly items: readonly { readonly href: string; readonly label: string }[];
}

/** モバイルでは上部に折り返し、デスクトップでは常設サイドバーとして表示する。 */
export function AdminNavigation({
  groups,
  label,
}: {
  readonly groups: readonly AdminNavGroup[];
  readonly label: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="admin-navigation">
      {groups.map((group) => (
        <div key={group.label} className="admin-nav-group">
          <p className="admin-nav-label">{group.label}</p>
          <div className="admin-nav-items">
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="admin-nav-link"
                >
                  <span className="admin-nav-dot" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
