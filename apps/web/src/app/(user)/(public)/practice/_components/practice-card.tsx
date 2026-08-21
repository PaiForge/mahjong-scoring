import Link from "next/link";
import { BookIcon } from "@/app/_components/icons/book-icon";
import { ChevronRightIcon } from "@/app/_components/icons/chevron-right-icon";

interface PracticeCardProps {
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
  beginner: "bg-success-subtle text-success-strong",
  intermediate: "bg-warning-subtle text-warning-strong",
  advanced: "bg-destructive-subtle text-destructive-strong",
} as const;

export function PracticeCard({
  href,
  title,
  description,
  difficulty,
  difficultyLabel,
  startLabel,
  learnHref,
  learnLabel,
}: PracticeCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border-3 border-ink bg-white p-5 shadow-sm transition-transform hover:-translate-y-1">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-surface-900">{title}</h3>
          <span
            className={`rounded-full border-2 border-ink px-2 py-0.5 text-xs font-bold ${difficultyColor[difficulty]}`}
          >
            {difficultyLabel}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-surface-500">
          {description}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Link
          href={href}
          className="flex items-center text-sm font-bold text-primary-600 transition-colors hover:text-primary-700"
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
