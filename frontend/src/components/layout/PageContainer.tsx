import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageContainer({ children, className, ...props }: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}
