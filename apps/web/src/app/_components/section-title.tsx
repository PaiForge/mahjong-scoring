interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className = "" }: SectionTitleProps) {
  return (
    <h2
      className={`text-base md:text-lg font-medium border-b-2 border-primary-500 pb-2 leading-normal ${className}`}
    >
      {children}
    </h2>
  );
}
