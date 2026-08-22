import type { ReactNode } from "react";

import Link from "next/link";
import { TEXT_LINK_MUTED_CLASSES } from "@/app/_components/_lib/link-classes";
import { LinkButton } from "@/app/(user)/_components/link-button";

interface StepCardProps {
  readonly stepLabel?: string;
  readonly icon: ReactNode;
  readonly iconClassName: string;
  readonly title: string;
  readonly description: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
  readonly subLabel?: string;
  readonly subHref?: string;
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
    <div className="flex flex-col items-center space-y-4 rounded-lg border-3 border-ink bg-white p-6 text-center">
      {stepLabel ? (
        <span className="text-xs font-bold tracking-wider text-primary-600">
          {stepLabel}
        </span>
      ) : null}
      <div
        className={`flex size-14 items-center justify-center rounded-2xl border-3 border-ink shadow-xs ${iconClassName}`}
      >
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
      <p className="text-sm leading-relaxed text-surface-500">{description}</p>
      <div className="mt-auto flex w-full flex-col items-center gap-3 pt-2">
        <LinkButton href={ctaHref}>{ctaLabel}</LinkButton>
        <div className="flex min-h-5 items-center">
          {subLabel && subHref ? (
            <Link
              href={subHref}
              className={`text-sm ${TEXT_LINK_MUTED_CLASSES}`}
            >
              {subLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
