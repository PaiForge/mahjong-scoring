import Link from "next/link";
import { BookIcon } from "@/app/_components/icons/book-icon";
import { ChevronRightIcon } from "@/app/_components/icons/chevron-right-icon";

interface DrillCardProps {
  href: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  difficultyLabel: string;
  startLabel: string;
  learnHref?: string;
  learnLabel?: string;
}

const difficultyColor = {
  beginner: "bg-primary-100 text-primary-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
} as const;

export function DrillCard({
  href,
  title,
  description,
  difficulty,
  difficultyLabel,
  startLabel,
  learnHref,
  learnLabel,
}: DrillCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-surface-900">{title}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor[difficulty]}`}
          >
            {difficultyLabel}
          </span>
        </div>
        <p className="mt-2 text-sm text-surface-500">{description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Link
          href={href}
          className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          {startLabel}
          <ChevronRightIcon className="ml-1 size-4" />
        </Link>
        {learnHref && learnLabel && (
          <Link
            href={learnHref}
            className="flex items-center gap-1 text-sm text-surface-400 hover:text-primary-600 transition-colors"
          >
            <BookIcon className="size-4" />
            {learnLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
