import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("mx-auto max-w-lg px-4 py-4 pb-20", className)}>
      {children}
    </main>
  );
}
