import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[22px] border border-border-subtle bg-surface-1 text-text-1 shadow-[0_2px_16px_rgba(0,0,0,0.05)]",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };

