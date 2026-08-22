import Link from "next/link";

export interface BreadcrumbItem {
  readonly label: string;
  /** 省略時はリンクなし（現在地）として表示する */
  readonly href?: string;
}

interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** トップ階層（ホーム）のラベル。チェスではロゴだが、ここでは絵文字を使う。 */
const HOME_LABEL = "ホーム";

/**
 * パンくずリスト（blindfold-chess の Breadcrumb 準拠）。
 *
 * 先頭はホーム（チェスではロゴ画像だが、ここでは 🏠 絵文字）。
 * SEO 用に BreadcrumbList の JSON-LD も出力する。
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: HOME_LABEL,
        item: SITE_URL || undefined,
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        item: item.href ? `${SITE_URL}${item.href}` : undefined,
      })),
    ],
  };

  return (
    <nav aria-label="Breadcrumb" className="flex min-h-6 items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ol className="flex flex-wrap items-center gap-x-1 text-sm">
        <li>
          <Link
            href="/"
            aria-label={HOME_LABEL}
            className="transition-opacity hover:opacity-70"
          >
            🏠
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <span className="mx-1 text-muted-foreground">/</span>
            {item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
