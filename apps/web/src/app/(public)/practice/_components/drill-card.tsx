import Link from "next/link";

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
          <svg
            className="ml-1 size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
        {learnHref && learnLabel && (
          <Link
            href={learnHref}
            className="flex items-center gap-1 text-sm text-surface-400 hover:text-primary-600 transition-colors"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {learnLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
