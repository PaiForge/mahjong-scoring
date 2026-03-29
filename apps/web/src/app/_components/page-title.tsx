interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTitle({ children, className = "" }: PageTitleProps) {
  return (
    <h1
      className={`text-xl font-semibold text-surface-700 ${className}`}
    >
      {children}
    </h1>
  );
}
