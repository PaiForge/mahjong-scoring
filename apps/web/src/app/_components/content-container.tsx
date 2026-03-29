interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentContainer({ children, className = "" }: ContentContainerProps) {
  return (
    <div className={`mx-auto max-w-3xl px-6 py-8 ${className}`}>
      {children}
    </div>
  );
}
