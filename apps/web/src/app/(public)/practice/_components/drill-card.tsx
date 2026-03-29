import Link from "next/link";

interface DrillCardProps {
  href: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

const difficultyLabel = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
} as const;

const difficultyColor = {
  beginner: "bg-primary-100 text-primary-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
} as const;

export function DrillCard({ href, title, description, difficulty }: DrillCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-surface-900 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor[difficulty]}`}>
            {difficultyLabel[difficulty]}
          </span>
        </div>
        <p className="mt-2 text-sm text-surface-500">{description}</p>
      </div>
      <div className="mt-4 flex items-center text-sm font-medium text-primary-600">
        スタート
        <svg className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
