import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border-subtle bg-surface-1 text-text-1 shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };

