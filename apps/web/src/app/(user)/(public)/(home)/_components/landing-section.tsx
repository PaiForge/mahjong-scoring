import type { ReactNode } from "react";

import Link from "next/link";

interface LandingSectionProps {
  readonly sectionClassName: string;
  readonly icon: ReactNode;
  readonly iconClassName: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly ctaLabel: string;
  readonly ctaClassName: string;
}

export function LandingSection({
  sectionClassName,
  icon,
  iconClassName,
  title,
  description,
  href,
  ctaLabel,
  ctaClassName,
}: LandingSectionProps) {
  return (
    <section className={`px-6 py-24 ${sectionClassName}`}>
      <div className="mx-auto flex max-w-4xl flex-col items-center space-y-8 text-center">
        <div
          className={`flex size-16 items-center justify-center rounded-2xl border-4 border-ink shadow-sm ${iconClassName}`}
        >
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-surface-900">{title}</h2>
        <p className="max-w-2xl text-lg font-medium leading-relaxed text-surface-500">
          {description}
        </p>
        <div className="pt-4">
          <Link
            href={href}
            className={`press-md inline-flex items-center justify-center rounded-lg border-4 border-ink px-8 py-3 text-base font-bold shadow-md ${ctaClassName}`}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
