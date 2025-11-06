import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal Select stub — implement proper behaviour later or replace with Radix/Headless UI
export const Select = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref as any} className={cn("inline-block", className)} {...props}>
      {children}
    </div>
  )
);
Select.displayName = "Select";

export function SelectTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={cn("inline-flex items-center px-2 py-1 rounded-md")}>{children}</button>
  );
}

export function SelectValue({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn("inline-block")}>{children}</span>;
}

export function SelectContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("bg-white shadow rounded p-2")}>{children}</div>;
}

export const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} {...props} className={cn("px-2 py-1 hover:bg-slate-100 rounded", className)}>
      {children}
    </div>
  )
);
SelectItem.displayName = "SelectItem";

export { Select as default };
