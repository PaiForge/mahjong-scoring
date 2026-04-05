interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <h2
      className={`text-base font-semibold text-surface-800 border-l-4 border-primary-500 pl-3 ${className}`}
    >
      {children}
    </h2>
  );
}
