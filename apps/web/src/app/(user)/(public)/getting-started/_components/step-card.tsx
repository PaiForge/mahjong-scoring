import type { ReactNode } from "react";

import Link from "next/link";

interface StepCardProps {
  readonly stepLabel: string;
  readonly icon: ReactNode;
  readonly iconClassName: string;
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly subLabel: string;
  readonly subHref: string;
}

export function StepCard({
  stepLabel,
  icon,
  iconClassName,
  title,
  description,
  ctaLabel,
  ctaHref,
  subLabel,
  subHref,
}: StepCardProps) {
  return (
    <div className="flex flex-col items-center space-y-4 rounded-lg border border-surface-200 bg-white p-6 text-center">
      <span className="text-xs font-bold tracking-wider text-primary-600">
        {stepLabel}
      </span>
      <div
        className={`flex size-14 items-center justify-center rounded-2xl ${iconClassName}`}
      >
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
      <p className="text-sm leading-relaxed text-surface-500">{description}</p>
      <div className="mt-auto flex flex-col items-center gap-3 pt-2">
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
        >
          {ctaLabel}
        </Link>
        <Link
          href={subHref}
          className="text-sm text-surface-500 underline-offset-2 transition-colors hover:text-surface-700 hover:underline"
        >
          {subLabel}
        </Link>
      </div>
    </div>
  );
}
