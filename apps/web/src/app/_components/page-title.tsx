interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTitle({ children, className = "" }: PageTitleProps) {
  return (
    <h1
      className={`text-lg font-bold tracking-tight text-surface-900 ${className}`}
    >
      {children}
    </h1>
  );
}
