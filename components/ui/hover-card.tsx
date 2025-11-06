import * as React from "react";
import { cn } from "@/lib/utils";

export const HoverCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("inline-block", className)} {...props}>
      {children}
    </div>
  );
};

export const HoverCardTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className={cn("inline-flex cursor-pointer")}>{children}</div>
  )
);
HoverCardTrigger.displayName = "HoverCardTrigger";

export const HoverCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} {...props} className={cn("bg-white border rounded shadow p-3", className)}>
      {children}
    </div>
  )
);
HoverCardContent.displayName = "HoverCardContent";

export default HoverCard;
