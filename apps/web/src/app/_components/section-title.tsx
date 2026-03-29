interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <h2
      className={`text-base font-semibold text-surface-600 border-l-3 border-primary-400 pl-3 ${className}`}
    >
      {children}
    </h2>
  );
}
